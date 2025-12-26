
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

// NEW: Safe wrapper result type
export type InvokeEdgeSafeResult<T = any> = {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    status?: number;
    details?: any;
  };
};

// Configuration for retry logic
const MAX_RETRIES = 2;
const RETRY_DELAYS = [250, 800]; // ms - exponential backoff
const TIMEOUT_MS = 20000; // 20 seconds
const TRANSIENT_STATUS_CODES = [502, 503, 504];

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

    console.warn('[copyDebugToClipboard] Clipboard API not available in this environment.');
    return false;
  } catch (e: any) {
    console.warn('[copyDebugToClipboard] Failed', { message: e?.message });
    return false;
  }
}

/**
 * NEW: Safe wrapper around supabase.functions.invoke with retry logic and timeout
 * 
 * Features:
 * - Never throws - always returns { ok, data?, error? }
 * - Retries transient failures (502/503/504) up to 2 times with backoff
 * - Implements 20s timeout to prevent hanging
 * - Extracts detailed error information for debugging
 * - Handles all error types: FunctionsHttpError, network errors, timeouts
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

  while (attempt <= MAX_RETRIES) {
    let timeoutId: NodeJS.Timeout | null = null;
    let controller: AbortController | null = null;

    try {
      // Create AbortController for timeout
      controller = new AbortController();
      timeoutId = setTimeout(() => {
        console.log(`[invokeEdgeSafe] Timeout reached for ${functionName} (attempt ${attempt + 1})`);
        controller?.abort();
      }, TIMEOUT_MS);

      console.log(`[invokeEdgeSafe] Invoking ${functionName} (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);

      // Call the Edge Function with timeout signal
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
        // @ts-expect-error - signal is supported but not in types
        signal: controller.signal,
      });

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

        console.error(`[invokeEdgeSafe] ${functionName} error (attempt ${attempt + 1}):`, {
          name: (error as any)?.name,
          message: (error as any)?.message,
          status,
          statusText,
        });

        // Check if this is a transient error that should be retried
        if (status && TRANSIENT_STATUS_CODES.includes(status) && attempt < MAX_RETRIES) {
          const delay = RETRY_DELAYS[attempt];
          console.log(`[invokeEdgeSafe] Transient error ${status}, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue; // Retry
        }

        // Non-transient error or max retries reached - return error
        return {
          ok: false,
          error: {
            code: (error as any)?.name || 'EDGE_FUNCTION_ERROR',
            message: (error as any)?.message || 'Edge Function returned an error',
            status,
            details: {
              statusText,
              context,
              attempt: attempt + 1,
            },
          },
        };
      }

      // Success - parse and return data
      console.log(`[invokeEdgeSafe] ${functionName} succeeded (attempt ${attempt + 1})`);

      // Handle string responses
      if (typeof data === 'string') {
        const parsed = safeJsonParse(data);
        if (parsed) {
          return { ok: true, data: parsed as T };
        }
        console.warn(`[invokeEdgeSafe] Non-JSON string response from ${functionName}`);
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
          console.error(`[invokeEdgeSafe] Failed reading Response body:`, readError?.message);
          return {
            ok: false,
            error: {
              code: 'READ_RESPONSE_FAILED',
              message: readError?.message || 'Failed reading response body',
              details: { attempt: attempt + 1 },
            },
          };
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

      // Handle AbortError (timeout)
      if (e.name === 'AbortError') {
        console.error(`[invokeEdgeSafe] ${functionName} timed out (attempt ${attempt + 1})`);
        
        // Retry timeout errors
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAYS[attempt];
          console.log(`[invokeEdgeSafe] Timeout, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }

        return {
          ok: false,
          error: {
            code: 'TIMEOUT',
            message: `Edge Function timed out after ${TIMEOUT_MS}ms`,
            details: { attempt: attempt + 1 },
          },
        };
      }

      // Handle FunctionsHttpError
      if (e instanceof FunctionsHttpError) {
        const status = e.status;
        const statusText = e.statusText;

        console.error(`[invokeEdgeSafe] FunctionsHttpError for ${functionName} (attempt ${attempt + 1}):`, {
          status,
          statusText,
          message: e.message,
        });

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
          console.warn(`[invokeEdgeSafe] Could not extract error details:`, extractError);
        }

        // Check if this is a transient error that should be retried
        if (TRANSIENT_STATUS_CODES.includes(status) && attempt < MAX_RETRIES) {
          const delay = RETRY_DELAYS[attempt];
          console.log(`[invokeEdgeSafe] Transient HTTP error ${status}, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue; // Retry
        }

        // Non-transient error or max retries reached
        return {
          ok: false,
          error: {
            code: 'FUNCTIONS_HTTP_ERROR',
            message: e.message || `HTTP ${status} error`,
            status,
            details: {
              statusText,
              body: bodyJson || bodyText,
              headers,
              attempt: attempt + 1,
            },
          },
        };
      }

      // Handle other unexpected errors
      console.error(`[invokeEdgeSafe] Unexpected error for ${functionName} (attempt ${attempt + 1}):`, {
        name: e?.name,
        message: e?.message,
        stack: e?.stack,
      });

      // Don't retry unexpected errors
      return {
        ok: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: e?.message || 'Unexpected error calling Edge Function',
          details: {
            name: e?.name,
            stack: e?.stack,
            attempt: attempt + 1,
          },
        },
      };
    }
  }

  // Should never reach here, but just in case
  return {
    ok: false,
    error: {
      code: 'MAX_RETRIES_EXCEEDED',
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

      console.error('[invokeEdge] supabase.functions.invoke error', {
        functionName,
        name: (error as any)?.name,
        message: (error as any)?.message,
        status,
        context,
      });

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

      console.error('[invokeEdge] Non-JSON string response', { functionName, raw: data });
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

        console.error('[invokeEdge] Response-like non-JSON', { functionName, raw });
        return {
          data: null,
          error: { name: 'non_json_response', message: 'Edge function returned non-JSON response body' },
          debug: { raw },
        };
      } catch (e: any) {
        console.error('[invokeEdge] Failed reading Response-like body', { functionName, message: e?.message });
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
    console.error('[invokeEdge] exception', {
      functionName,
      message: e?.message,
      stack: e?.stack,
    });

    return {
      data: null,
      error: { name: 'invoke_exception', message: e?.message || 'Unexpected invoke exception' },
      debug: { message: e?.message, stack: e?.stack },
    };
  }
}
