
import { supabase, supabaseReady, getSupabaseConfig } from '../supabase';
import { getRetryDelay } from '../../utils/aiErrorHandling';

export type InvokeEdgeErrorCode =
  | 'EDGE_NOT_CONFIGURED'
  | 'EDGE_AUTH'
  | 'EDGE_TIMEOUT'
  | 'EDGE_ABORTED'
  | 'EDGE_UNAVAILABLE'
  | 'FUNCTIONS_HTTP_ERROR'
  | 'INVALID_RESPONSE'
  | 'UNEXPECTED_ERROR';

export interface InvokeEdgeErrorDetails {
  bodySnippet?: string;
  body?: string;
  context?: any;
}

export interface InvokeEdgeError {
  code: InvokeEdgeErrorCode;
  message: string;
  status?: number;
  name?: string;
  details?: InvokeEdgeErrorDetails;
}

export type InvokeEdgeResult<T = any> = {
  data: T | null;
  error: InvokeEdgeError | null;
};

export type InvokeEdgeSafeResult<T = any> =
  | { ok: true; data: T }
  | { ok: false; error: InvokeEdgeError };

export interface InvokeEdgeOptions {
  timeoutMs?: number;
  maxAttempts?: number;
}

const DEFAULT_TIMEOUT_MS = 20000;
const DEFAULT_MAX_ATTEMPTS = 2;

const isRetryableStatus = (status?: number): boolean =>
  status === 429 || status === 502 || status === 503 || status === 504;

const toBodySnippet = (body?: string): string | undefined =>
  body ? body.substring(0, 500) : undefined;

const logEdgeDiagnostic = (code: InvokeEdgeErrorCode, status: number | undefined, startedAt: number) => {
  if (!__DEV__) return;
  const durationMs = Date.now() - startedAt;
  console.warn(`[Edge] code=${code} status=${status ?? 'none'} duration_ms=${durationMs}`);
};

export async function invokeEdge<T = any>(
  functionName: string,
  body: any,
  options?: InvokeEdgeOptions
): Promise<InvokeEdgeResult<T>> {
  const result = await invokeEdgeSafe<T>(functionName, body, options);
  if (result.ok) {
    return { data: result.data, error: null };
  }
  return { data: null, error: result.error };
}

export async function invokeEdgeSafe<T = any>(
  functionName: string,
  payload: any,
  options?: InvokeEdgeOptions
): Promise<InvokeEdgeSafeResult<T>> {
  if (!supabaseReady || !supabase) {
    console.warn('[invokeEdgeSafe] Supabase is not configured');
    return {
      ok: false,
      error: {
        code: 'EDGE_NOT_CONFIGURED',
        message:
          'Supabase client is not configured. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
      },
    };
  }

  const config = getSupabaseConfig();
  const supabaseUrl = config.url;
  const supabaseAnonKey = config.anonKey;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[invokeEdgeSafe] Supabase config missing URL or anon key');
    return {
      ok: false,
      error: {
        code: 'EDGE_NOT_CONFIGURED',
        message:
          'Supabase URL or anon key missing. Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.',
      },
    };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    if (__DEV__) {
      console.warn('[invokeEdgeSafe] No session found for Edge Function call');
    }
    return {
      ok: false,
      error: {
        code: 'EDGE_AUTH',
        message: 'No session',
        status: 401,
      },
    };
  }

  const endpoint = `${supabaseUrl}/functions/v1/${functionName}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${accessToken}`,
  };

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const responseBody = await response.text();
        const status = response.status;
        const code: InvokeEdgeErrorCode = status === 401 || status === 403 ? 'EDGE_AUTH' : 'FUNCTIONS_HTTP_ERROR';
        const error: InvokeEdgeError = {
          code,
          message: `Edge Function error: ${status} ${response.statusText}`,
          status,
          name: 'FunctionsHttpError',
          details: {
            bodySnippet: toBodySnippet(responseBody),
            body: responseBody,
          },
        };

        logEdgeDiagnostic(code, status, startedAt);

        if (attempt < maxAttempts && isRetryableStatus(status)) {
          if (__DEV__) {
            console.warn(`[invokeEdgeSafe] ${functionName} error (attempt ${attempt}):`, {
              status,
              message: error.message,
            });
          }
          await new Promise((resolve) => setTimeout(resolve, getRetryDelay()));
          continue;
        }

        return { ok: false, error };
      }

      const data = await response.json().catch(() => null);
      if (data === null || data === undefined) {
        const error: InvokeEdgeError = {
          code: 'INVALID_RESPONSE',
          message: 'Edge Function returned empty or invalid JSON',
        };
        logEdgeDiagnostic(error.code, undefined, startedAt);
        return { ok: false, error };
      }

      return { ok: true, data: data as T };
    } catch (error: any) {
      clearTimeout(timeoutId);

      const isAbort = error?.name === 'AbortError';
      const code: InvokeEdgeErrorCode = isAbort
        ? 'EDGE_TIMEOUT'
        : error?.message?.toLowerCase?.().includes('network') || error?.message?.toLowerCase?.().includes('failed to fetch')
        ? 'EDGE_UNAVAILABLE'
        : 'UNEXPECTED_ERROR';

      const normalizedError: InvokeEdgeError = {
        code,
        message: isAbort ? 'Edge Function request timed out' : error?.message || 'Edge Function call failed',
        name: error?.name,
        details: {
          context: {
            attempt,
            functionName,
          },
        },
      };

      logEdgeDiagnostic(code, undefined, startedAt);

      if (attempt < maxAttempts && (code === 'EDGE_TIMEOUT' || code === 'EDGE_UNAVAILABLE')) {
        if (__DEV__) {
          console.warn(`[invokeEdgeSafe] ${functionName} error (attempt ${attempt}):`, {
            name: error?.name,
            message: error?.message,
          });
        }
        await new Promise((resolve) => setTimeout(resolve, getRetryDelay()));
        continue;
      }

      return { ok: false, error: normalizedError };
    }
  }

  return {
    ok: false,
    error: {
      code: 'UNEXPECTED_ERROR',
      message: 'Edge Function call failed after retries',
    },
  };
}
