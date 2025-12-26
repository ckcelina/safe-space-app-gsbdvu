import { supabase } from '../supabase';

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
