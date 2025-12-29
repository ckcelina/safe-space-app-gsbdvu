
import { supabase } from '../supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Platform } from 'react-native';

export type InvokeEdgeOk<T = any> = {
  data: T;
  error: null;
  debug?: any;
};

export type InvokeEdgeFail = {
  data: null;
  error: {
    name: string;
    message?: string;
    status?: number;
  };
  debug?: any;
};

export type InvokeEdgeResult<T = any> = InvokeEdgeOk<T> | InvokeEdgeFail;

// NEW: Safe wrapper result type
export type InvokeEdgeSafeResult<T = any> = {
  ok: boolean;
  data?: T;
  error?: {
    code: 'EDGE_ABORTED' | 'EDGE_TIMEOUT' | 'EDGE_AUTH' | 'EDGE_UNAVAILABLE' | 'EDGE_HTTP_ERROR' | 'EDGE_UNKNOWN';
    message: string;
    status?: number;
    details?: any;
  };
};

// Configuration for retry logic - PLATFORM-AWARE
const MAX_RETRIES = 3;
const RETRY_DELAYS = [600, 1200, 2400]; // ms - exponential backoff with jitter added below
const TIMEOUT_MS = Platform.OS === 'ios' ? 90000 : 60000; // 90s for iOS, 60s for Android/Web (increased from 60s/45s)
const TRANSIENT_STATUS_CODES = [502, 503, 504];

// Add random jitter to backoff delays (0-250ms)
function getRetryDelay(attempt: number): number {
  const baseDelay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
  const jitter = Math.random() * 250;
  return baseDelay + jitter;
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Keep this exported because chat.tsx calls it from this module.
 * NO new dependencies: use web clipboard if available, otherwise fail gracefully.
 */
export async function copyDebugToClipboard(text: any): Promise<boolean> {
  try {
    const t = typeof text === 'string' ? text : JSON.stringify(text, null, 2);

    const nav: any = (globalThis as any)?.navigator;
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(t);
      return true;
    }

    if (__DEV__) {
      console.warn('[copyDebugToClipboard] Clipboard API not available in this environment.');
    }
    return false;
  } catch (e: any) {
    if (__DEV__) {
      console.warn('[copyDebugToClipboard] Failed', { message: e?.message });
    }
    return false;
  }
}

/**
 * FIXED: Safe wrapper around supabase.functions.invoke with retry logic and timeout
 * 
 * Features:
 * - Never throws - always returns { ok, data?, error? }
 * - Retries transient failures (AbortError, 502/503/504, network errors) up to 3 times
 * - Implements platform-aware timeout (90s iOS, 60s Android/Web) - INCREASED
 * - Exponential backoff with jitter (600ms, 1200ms, 2400ms + random 0-250ms)
 * - Ensures auth/session is attached correctly with Authorization header
 * - Refreshes session token on each retry attempt
 * - Returns structured error codes for better error handling
 * - DEV-ONLY: Uses console.log/warn for transient errors (no red LogBox)
 * - CRITICAL: Validates session exists before invoking (returns EDGE_AUTH error if missing)
 * 
 * @param functionName - Name of the Edge Function to invoke
 * @param payload - Request body to send
 * @returns Promise<InvokeEdgeSafeResult<T>>
 */
export async function invokeEdgeSafe<T = any>(
  functionName: string,
  payload: any
): Promise<InvokeEdgeSafeResult<T>> {
  let attempt = 0;
  const startTime = Date.now();

  while (attempt <= MAX_RETRIES) {
    // ═══════════════════════════════════════════════════════════════════
    // CRITICAL FIX: Get fresh session token on EACH retry attempt
    // REQUIRED CHANGE A1: Validate session exists before invoking
    // ═══════════════════════════════════════════════════════════════════
    let authHeaders: Record<string, string> = {};
    let hasSessionToken = false;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // REQUIRED CHANGE A1: Return error if no session
      if (!session?.access_token) {
        if (__DEV__) {
          console.warn(`[invokeEdgeSafe] No session found (attempt ${attempt + 1}) - returning EDGE_AUTH error`);
        }
        
        return {
          ok: false,
          error: {
            code: 'EDGE_AUTH',
            message: 'No session',
            details: {
              attempt: attempt + 1,
              reason: 'Missing access token',
            },
          },
        };
      }
      
      // REQUIRED CHANGE A2: Include Authorization header explicitly
      authHeaders['Authorization'] = `Bearer ${session.access_token}`;
      hasSessionToken = true;
      
      if (__DEV__) {
        console.log(`[invokeEdgeSafe] Auth token attached (attempt ${attempt + 1})`);
      }
    } catch (sessionError: any) {
      if (__DEV__) {
        console.warn(`[invokeEdgeSafe] Failed to get session (attempt ${attempt + 1}):`, sessionError?.message);
      }
      
      // Return error if session fetch fails
      return {
        ok: false,
        error: {
          code: 'EDGE_AUTH',
          message: 'Failed to get session',
          details: {
            attempt: attempt + 1,
            error: sessionError?.message,
          },
        },
      };
    }

    // Web-compatible timeout typing
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;
    let signal: AbortSignal | undefined = undefined;
    let didTimeout = false;

    // Only use AbortController if it exists (web/RN compatibility)
    const hasAbortController = typeof AbortController !== 'undefined';
    if (hasAbortController) {
      controller = new AbortController();
      signal = controller.signal;
    }

    try {
      // REQUIRED CHANGE A3: DEV-ONLY diagnostics with console.warn (no red screen)
      if (__DEV__) {
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zjzvkxvahrbuuyzjzxol.supabase.co';
        const projectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split('.')[0] : 'unknown';
        console.log(`[Edge] invoke ${functionName} attempt ${attempt + 1}/${MAX_RETRIES + 1} project ${projectRef} platform=${Platform.OS} timeout=${TIMEOUT_MS}ms hasToken=${hasSessionToken}`);
      }

      // Set up timeout - INCREASED to 90s for iOS, 60s for others
      if (controller) {
        timeoutId = setTimeout(() => {
          didTimeout = true;
          if (__DEV__) {
            console.warn(`[invokeEdgeSafe] Timeout reached for ${functionName} after ${TIMEOUT_MS}ms (attempt ${attempt + 1})`);
          }
          controller?.abort();
        }, TIMEOUT_MS);
      }

      // REQUIRED CHANGE A2: Call the Edge Function with explicit Authorization header
      const invokeOptions: any = {
        body: payload,
        headers: authHeaders, // Always include headers (even if empty object)
      };
      
      // Only add signal if AbortController is available
      if (signal) {
        invokeOptions.signal = signal;
      }

      if (__DEV__) {
        console.log(`[invokeEdgeSafe] Calling supabase.functions.invoke with:`, {
          functionName,
          hasHeaders: !!invokeOptions.headers,
          hasAuthHeader: !!authHeaders['Authorization'],
          hasSignal: !!invokeOptions.signal,
          payloadKeys: Object.keys(payload || {}),
        });
      }

      const { data, error } = await supabase.functions.invoke(functionName, invokeOptions);

      // Clear timeout on completion
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Check for Supabase invocation error
      if (error) {
        const status = (error as any)?.status;
        const statusText = (error as any)?.statusText;
        const context = (error as any)?.context;
        const duration = Date.now() - startTime;

        if (__DEV__) {
          // REQUIRED CHANGE A3: Use console.warn for failures (no red LogBox)
          console.warn(`[invokeEdgeSafe] ${functionName} error (attempt ${attempt + 1}):`, {
            name: (error as any)?.name,
            message: (error as any)?.message,
            status,
            statusText,
            hasSession: hasSessionToken,
          });

          // DEV-ONLY: Log compact diagnostic line
          const normalizedCode = (error as any)?.name || 'EDGE_FUNCTION_ERROR';
          console.log(`[Edge] code=${normalizedCode} status=${status || 'none'} duration_ms=${duration} hasSession=${hasSessionToken}`);
        }

        // Check if this is a transient error that should be retried
        if (status && TRANSIENT_STATUS_CODES.includes(status) && attempt < MAX_RETRIES) {
          const delay = getRetryDelay(attempt);
          if (__DEV__) {
            console.warn(`[invokeEdgeSafe] Transient error ${status}, retrying in ${delay}ms...`);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue; // Retry
        }

        // Determine error code based on status
        let errorCode: InvokeEdgeSafeResult['error']['code'] = 'EDGE_HTTP_ERROR';
        if (status === 401 || status === 403) {
          errorCode = 'EDGE_AUTH';
        } else if (status && TRANSIENT_STATUS_CODES.includes(status)) {
          errorCode = 'EDGE_UNAVAILABLE';
        }

        // Non-transient error or max retries reached - return error
        return {
          ok: false,
          error: {
            code: errorCode,
            message: (error as any)?.message || 'Edge Function returned an error',
            status,
            details: {
              statusText,
              context,
              attempt: attempt + 1,
              hasSession: hasSessionToken,
            },
          },
        };
      }

      // Success - parse and return data
      if (__DEV__) {
        console.log(`[invokeEdgeSafe] ${functionName} succeeded (attempt ${attempt + 1})`);
        console.log(`[invokeEdgeSafe] Response data type:`, typeof data);
        console.log(`[invokeEdgeSafe] Response data keys:`, data && typeof data === 'object' ? Object.keys(data) : 'N/A');
      }

      // Handle string responses
      if (typeof data === 'string') {
        const parsed = safeJsonParse(data);
        if (parsed) {
          if (__DEV__) {
            console.log(`[invokeEdgeSafe] Parsed string response, keys:`, Object.keys(parsed));
          }
          return { ok: true, data: parsed as T };
        }
        if (__DEV__) {
          console.warn(`[invokeEdgeSafe] Non-JSON string response from ${functionName}`);
        }
        return { ok: true, data: data as T };
      }

      // Handle Response-like objects
      if (data && typeof data === 'object' && typeof (data as any).text === 'function') {
        try {
          const raw = await (data as any).text();
          const parsed = safeJsonParse(raw);
          if (parsed) {
            if (__DEV__) {
              console.log(`[invokeEdgeSafe] Parsed Response body, keys:`, Object.keys(parsed));
            }
            return { ok: true, data: parsed as T };
          }
          return { ok: true, data: raw as T };
        } catch (readError: any) {
          if (__DEV__) {
            console.warn(`[invokeEdgeSafe] Failed reading Response body:`, readError?.message);
          }
          return {
            ok: false,
            error: {
              code: 'EDGE_UNKNOWN',
              message: readError?.message || 'Failed reading response body',
              details: { attempt: attempt + 1 },
            },
          };
        }
      }

      // Normal case - data is already parsed
      if (__DEV__) {
        console.log(`[invokeEdgeSafe] Returning parsed data directly`);
      }
      return { ok: true, data: data as T };

    } catch (e: any) {
      // Clear timeout if it exists
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      const duration = Date.now() - startTime;

      // Handle AbortError (timeout or manual abort)
      if (e.name === 'AbortError') {
        const errorCode: InvokeEdgeSafeResult['error']['code'] = didTimeout ? 'EDGE_TIMEOUT' : 'EDGE_ABORTED';
        
        if (__DEV__) {
          // REQUIRED CHANGE A3: Use console.warn for transient errors (no red LogBox)
          console.warn(`[Edge] code=${errorCode} status=N/A duration_ms=${duration} hasSession=${hasSessionToken}`);
        }

        // Retry abort/timeout errors
        if (attempt < MAX_RETRIES) {
          const delay = getRetryDelay(attempt);
          if (__DEV__) {
            console.warn(`[invokeEdgeSafe] ${didTimeout ? 'Timeout' : 'Abort'} detected, retrying in ${delay}ms...`);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }

        // Max retries reached - return normalized error
        return {
          ok: false,
          error: {
            code: errorCode,
            message: didTimeout ? 'Request timed out' : 'Request was aborted',
            details: { 
              attempt: attempt + 1,
              timeoutMs: TIMEOUT_MS,
              hasSession: hasSessionToken,
            },
          },
        };
      }

      // Handle FunctionsHttpError
      if (e instanceof FunctionsHttpError) {
        const status = e.status;
        const statusText = e.statusText;

        if (__DEV__) {
          // REQUIRED CHANGE A3: Use console.warn for transient errors (no red LogBox)
          console.warn(`[invokeEdgeSafe] FunctionsHttpError for ${functionName} (attempt ${attempt + 1}):`, {
            status,
            statusText,
            message: e.message,
            hasSession: hasSessionToken,
          });

          // DEV-ONLY: Log compact diagnostic line
          console.log(`[Edge] code=FUNCTIONS_HTTP_ERROR status=${status} duration_ms=${duration} hasSession=${hasSessionToken}`);
        }

        // Try to extract response body
        let bodyText = null;
        let bodyJson = null;
        let headers = null;

        try {
          if (e.context) {
            // Try to clone the response first to avoid consuming it
            const contextClone = e.context.clone ? e.context.clone() : e.context;
            
            // Try to read body as text
            if (typeof contextClone.text === 'function') {
              bodyText = await contextClone.text();
              bodyJson = safeJsonParse(bodyText);
            }
            // Try to extract headers
            if (e.context.headers && typeof e.context.headers.entries === 'function') {
              headers = Object.fromEntries(e.context.headers.entries());
            }
          }
        } catch (extractError) {
          if (__DEV__) {
            console.log(`[invokeEdgeSafe] Could not extract error details:`, extractError);
          }
        }

        // Check if this is a transient error that should be retried
        if (TRANSIENT_STATUS_CODES.includes(status) && attempt < MAX_RETRIES) {
          const delay = getRetryDelay(attempt);
          if (__DEV__) {
            console.warn(`[invokeEdgeSafe] Transient HTTP error ${status}, retrying in ${delay}ms...`);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue; // Retry
        }

        // Determine error code based on status
        let errorCode: InvokeEdgeSafeResult['error']['code'] = 'EDGE_HTTP_ERROR';
        if (status === 401 || status === 403) {
          errorCode = 'EDGE_AUTH';
        } else if (TRANSIENT_STATUS_CODES.includes(status)) {
          errorCode = 'EDGE_UNAVAILABLE';
        }

        // Non-transient error or max retries reached
        return {
          ok: false,
          error: {
            code: errorCode,
            message: e.message || `HTTP ${status} error`,
            status,
            details: {
              statusText,
              body: bodyJson || bodyText,
              headers,
              attempt: attempt + 1,
              hasSession: hasSessionToken,
            },
          },
        };
      }

      // Handle other unexpected errors (network errors, etc.)
      if (__DEV__) {
        // REQUIRED CHANGE A3: Use console.warn for transient errors (no red LogBox)
        console.warn(`[invokeEdgeSafe] Unexpected error for ${functionName} (attempt ${attempt + 1}):`, {
          name: e?.name,
          message: e?.message,
          stack: e?.stack,
          hasSession: hasSessionToken,
        });

        // DEV-ONLY: Log compact diagnostic line
        console.log(`[Edge] code=UNEXPECTED_ERROR status=none duration_ms=${duration} hasSession=${hasSessionToken}`);
      }

      // Check if this is a network error that should be retried
      const isNetworkError =
        e.message?.includes('Failed to fetch') ||
        e.message?.includes('Network request failed') ||
        e.message?.includes('Network error') ||
        e.code === 'FunctionsFetchError';

      if (isNetworkError && attempt < MAX_RETRIES) {
        const delay = getRetryDelay(attempt);
        if (__DEV__) {
          console.warn(`[invokeEdgeSafe] Network error, retrying in ${delay}ms...`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
        continue;
      }

      // Don't retry other unexpected errors
      return {
        ok: false,
        error: {
          code: 'EDGE_UNKNOWN',
          message: e?.message || 'Unexpected error calling Edge Function',
          details: {
            name: e?.name,
            stack: e?.stack,
            attempt: attempt + 1,
            hasSession: hasSessionToken,
          },
        },
      };
    }
  }

  // Should never reach here, but just in case
  const duration = Date.now() - startTime;
  
  if (__DEV__) {
    // DEV-ONLY: Log compact diagnostic line
    console.warn(`[Edge] code=MAX_RETRIES_EXCEEDED status=none duration_ms=${duration}`);
  }

  return {
    ok: false,
    error: {
      code: 'EDGE_UNKNOWN',
      message: `Failed after ${MAX_RETRIES + 1} attempts`,
      details: { attempts: MAX_RETRIES + 1 },
    },
  };
}

/**
 * LEGACY: Original invokeEdge function - kept for backward compatibility
 * Consider migrating to invokeEdgeSafe for better error handling
 */
export async function invokeEdge<T = any>(functionName: string, body: any): Promise<InvokeEdgeResult<T>> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body });

    // Supabase invocation error (network/auth/edge runtime/etc.)
    if (error) {
      const status = (error as any)?.status;
      const context = (error as any)?.context;

      if (__DEV__) {
        console.log('[invokeEdge] supabase.functions.invoke error', {
          functionName,
          name: (error as any)?.name,
          message: (error as any)?.message,
          status,
          context,
        });
      }

      return {
        data: null,
        error: {
          name: (error as any)?.name || 'invoke_error',
          message: (error as any)?.message,
          status,
        },
        debug: { status, context, message: (error as any)?.message },
      };
    }

    // If Supabase gave us a string, attempt to parse JSON
    if (typeof data === 'string') {
      const parsed = safeJsonParse(data);
      if (parsed) return { data: parsed as T, error: null };

      if (__DEV__) {
        console.log('[invokeEdge] Non-JSON string response', { functionName, raw: data });
      }
      return {
        data: null,
        error: { name: 'non_json_response', message: 'Edge function returned a non-JSON string' },
        debug: { raw: data },
      };
    }

    // If data looks like Response-like, read it safely
    if (data && typeof data === 'object' && typeof (data as any).text === 'function') {
      try {
        const raw = await (data as any).text();
        const parsed = safeJsonParse(raw);
        if (parsed) return { data: parsed as T, error: null };

        if (__DEV__) {
          console.log('[invokeEdge] Response-like non-JSON', { functionName, raw });
        }
        return {
          data: null,
          error: { name: 'non_json_response', message: 'Edge function returned non-JSON response body' },
          debug: { raw },
        };
      } catch (e: any) {
        if (__DEV__) {
          console.log('[invokeEdge] Failed reading Response-like body', { functionName, message: e?.message });
        }
        return {
          data: null,
          error: { name: 'read_response_failed', message: e?.message || 'Failed reading response body' },
          debug: { message: e?.message },
        };
      }
    }

    // Normal case: data is already JSON/object
    return { data: data as T, error: null };
  } catch (e: any) {
    if (__DEV__) {
      console.log('[invokeEdge] exception', {
        functionName,
        message: e?.message,
        stack: e?.stack,
      });
    }

    return {
      data: null,
      error: { name: 'invoke_exception', message: e?.message || 'Unexpected invoke exception' },
      debug: { message: e?.message, stack: e?.stack },
    };
  }
}
