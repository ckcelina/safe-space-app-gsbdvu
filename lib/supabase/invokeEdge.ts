
import { supabase } from '../supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';

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

// NEW: Safe wrapper result type - NORMALIZED STRUCTURE
export type InvokeEdgeSafeResult<T = any> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; status?: number } };

// Configuration for retry logic
const MAX_RETRIES = 2;
const RETRY_DELAYS = [250, 800]; // ms - exponential backoff
const TIMEOUT_MS = 30000; // 30 seconds - HARD TIMEOUT
const TRANSIENT_STATUS_CODES = [429, 502, 503, 504]; // Added 429 for rate limiting

/**
 * Safely stringify an object, handling circular references and truncating to maxLength
 */
function safeStringify(obj: any, maxLength: number = 500): string {
  try {
    if (obj === null || obj === undefined) {
      return String(obj);
    }
    if (typeof obj === 'string') {
      return obj.substring(0, maxLength);
    }
    const str = JSON.stringify(obj, (key, value) => {
      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: value.stack,
          };
        }
      }
      return value;
    });
    return str.substring(0, maxLength);
  } catch (e) {
    return '[Stringify Error]';
  }
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
 * Check if an error is transient and should be retried
 */
function isTransientError(error: any): boolean {
  const status = error?.status;
  const message = error?.message?.toLowerCase() || '';
  
  // Check status codes
  if (status && TRANSIENT_STATUS_CODES.includes(status)) {
    return true;
  }
  
  // Check error messages for network/timeout issues
  if (
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('network request failed')
  ) {
    return true;
  }
  
  return false;
}

/**
 * NEW: Safe wrapper around supabase.functions.invoke with retry logic and timeout
 * 
 * Features:
 * - Never throws - always returns { ok, data?, error? }
 * - Retries transient failures (429/502/503/504/network/timeout) up to 2 times with backoff
 * - Implements 30s hard timeout using AbortController
 * - Retries timeout errors once before giving up
 * - Extracts detailed error information for debugging
 * - Handles all error types: FunctionsHttpError, network errors, timeouts
 * - DEV-ONLY: Logs Edge call start/success/failed
 * - Web-compatible: Uses ReturnType<typeof setTimeout> for timeout typing
 * - Conditionally uses AbortController only if available
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
    // Web-compatible timeout typing
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;
    let signal: AbortSignal | undefined = undefined;

    // Only use AbortController if it exists (web/RN compatibility)
    const hasAbortController = typeof AbortController !== 'undefined';
    if (hasAbortController) {
      controller = new AbortController();
      signal = controller.signal;
    }

    try {
      // DEV-ONLY: Log Edge call start
      if (__DEV__) {
        console.log(`[AI] Edge call start: ${functionName} (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
      }

      // Set up hard timeout with AbortController
      if (controller) {
        timeoutId = setTimeout(() => {
          if (__DEV__) {
            console.log(`[AI] Edge call timeout: ${functionName} after ${TIMEOUT_MS}ms`);
          }
          controller?.abort();
        }, TIMEOUT_MS);
      }

      // Call the Edge Function with timeout signal (if available)
      const invokeOptions: any = {
        body: payload,
      };
      
      // Only add signal if AbortController is available
      if (signal) {
        invokeOptions.signal = signal;
      }

      const { data, error } = await supabase.functions.invoke(functionName, invokeOptions);

      // Clear timeout on completion
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Check for Supabase invocation error
      if (error) {
        const status = (error as any)?.status ?? undefined;
        const statusText = (error as any)?.statusText;
        const context = (error as any)?.context;

        // Determine error code based on status
        let errorCode = (error as any)?.name || 'EDGE_INVOKE_ERROR';
        if (status === 401 || status === 403) {
          errorCode = 'EDGE_AUTH';
        } else if (status && TRANSIENT_STATUS_CODES.includes(status)) {
          errorCode = 'EDGE_UNAVAILABLE';
        }

        const normalizedError: InvokeEdgeSafeResult<T> = {
          ok: false,
          error: {
            code: errorCode,
            message: (error as any)?.message || 'Edge function invoke failed',
            status,
          },
        };

        // DEV-ONLY: Log Edge call failed
        if (__DEV__) {
          console.log(`[AI] Edge call failed: ${functionName}`, {
            code: errorCode,
            status,
            message: normalizedError.error.message,
          });
        }

        // Check if this is a transient error that should be retried
        if (isTransientError({ status, message: (error as any)?.message }) && attempt < MAX_RETRIES) {
          const delay = RETRY_DELAYS[attempt];
          if (__DEV__) {
            console.log(`[AI] Retrying ${functionName} in ${delay}ms (transient error: ${status || 'network'})`);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue; // Retry
        }

        // Non-transient error or max retries reached - return normalized error
        return normalizedError;
      }

      // Check if data contains an error field (Edge Function returned error)
      if (data && typeof data === 'object' && data !== null && 'error' in data) {
        const errorData = (data as any).error;
        const status = errorData?.status ?? undefined;
        const code = errorData?.code ?? 'EDGE_FUNCTION_ERROR';
        const message = errorData?.message ?? 'Edge function returned an error';
        
        const normalizedError: InvokeEdgeSafeResult<T> = {
          ok: false,
          error: {
            code,
            message,
            status,
          },
        };

        // DEV-ONLY: Log Edge call failed
        if (__DEV__) {
          console.log(`[AI] Edge call failed: ${functionName} (function returned error)`, {
            code,
            status,
            message,
          });
        }

        return normalizedError;
      }

      // Success - parse and return data
      if (__DEV__) {
        const duration = Date.now() - startTime;
        console.log(`[AI] Edge call success: ${functionName} (${duration}ms)`);
      }

      // Handle string responses
      if (typeof data === 'string') {
        const parsed = safeJsonParse(data);
        if (parsed) {
          return { ok: true, data: parsed as T };
        }
        if (__DEV__) {
          console.warn(`[AI] Non-JSON string response from ${functionName}`);
        }
        return { ok: true, data: data as T };
      }

      // Handle Response-like objects
      if (data && typeof data === 'object' && typeof (data as any).text === 'function') {
        try {
          const raw = await (data as any).text();
          const parsed = safeJsonParse(raw);
          if (parsed) {
            return { ok: true, data: parsed as T };
          }
          return { ok: true, data: raw as T };
        } catch (readError: any) {
          const normalizedError: InvokeEdgeSafeResult<T> = {
            ok: false,
            error: {
              code: 'READ_RESPONSE_FAILED',
              message: readError?.message || 'Failed reading response body',
            },
          };

          if (__DEV__) {
            console.log(`[AI] Edge call failed: ${functionName} (read response error)`, normalizedError.error);
          }

          return normalizedError;
        }
      }

      // Normal case - data is already parsed
      return { ok: true, data: data as T };

    } catch (e: any) {
      // Clear timeout if it exists
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Handle AbortError (timeout) - RETRY ONCE before giving up
      if (e.name === 'AbortError') {
        const normalizedError: InvokeEdgeSafeResult<T> = {
          ok: false,
          error: {
            code: 'EDGE_TIMEOUT',
            message: `Request timed out after ${TIMEOUT_MS}ms`,
          },
        };

        // DEV-ONLY: Log Edge call failed
        if (__DEV__) {
          console.log(`[AI] Edge call failed: ${functionName} (timeout)`, normalizedError.error);
        }

        // Retry timeout errors once
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAYS[attempt];
          if (__DEV__) {
            console.log(`[AI] Retrying ${functionName} in ${delay}ms (timeout)`);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }

        // Max retries reached - return normalized error
        return normalizedError;
      }

      // Handle FunctionsHttpError
      if (e instanceof FunctionsHttpError) {
        const status = e.status ?? undefined;

        // Determine error code based on status
        let errorCode = 'EDGE_HTTP_ERROR';
        if (status === 401 || status === 403) {
          errorCode = 'EDGE_AUTH';
        } else if (status && TRANSIENT_STATUS_CODES.includes(status)) {
          errorCode = 'EDGE_UNAVAILABLE';
        }

        const normalizedError: InvokeEdgeSafeResult<T> = {
          ok: false,
          error: {
            code: errorCode,
            message: e.message || `HTTP ${status} error`,
            status,
          },
        };

        // DEV-ONLY: Log Edge call failed
        if (__DEV__) {
          console.log(`[AI] Edge call failed: ${functionName} (HTTP error)`, normalizedError.error);
        }

        // Check if this is a transient error that should be retried
        if (isTransientError({ status, message: e.message }) && attempt < MAX_RETRIES) {
          const delay = RETRY_DELAYS[attempt];
          if (__DEV__) {
            console.log(`[AI] Retrying ${functionName} in ${delay}ms (transient HTTP error: ${status})`);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue; // Retry
        }

        // Non-transient error or max retries reached
        return normalizedError;
      }

      // Handle other unexpected errors (network errors, etc.)
      const normalizedError: InvokeEdgeSafeResult<T> = {
        ok: false,
        error: {
          code: 'EDGE_NETWORK_ERROR',
          message: e?.message || 'Network error calling Edge Function',
        },
      };

      // DEV-ONLY: Log Edge call failed
      if (__DEV__) {
        console.log(`[AI] Edge call failed: ${functionName} (network error)`, {
          code: normalizedError.error.code,
          message: normalizedError.error.message,
          errorName: e?.name,
        });
      }

      // Check if this is a network error that should be retried
      if (isTransientError({ message: e?.message }) && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt];
        if (__DEV__) {
          console.log(`[AI] Retrying ${functionName} in ${delay}ms (network error)`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
        continue;
      }

      // Don't retry other unexpected errors - return normalized error
      return normalizedError;
    }
  }

  // Should never reach here, but just in case
  const normalizedError: InvokeEdgeSafeResult<T> = {
    ok: false,
    error: {
      code: 'MAX_RETRIES_EXCEEDED',
      message: `Failed after ${MAX_RETRIES + 1} attempts`,
    },
  };

  if (__DEV__) {
    console.log(`[AI] Edge call failed: ${functionName} (max retries exceeded)`, normalizedError.error);
  }

  return normalizedError;
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
