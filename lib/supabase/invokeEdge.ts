
import { supabase } from '../supabase';

export interface InvokeEdgeError {
  success: false;
  reply: null;
  error: string;
  debug?: any;
}

type InvokeEdgeResult = any | InvokeEdgeError;

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function invokeEdge(functionName: string, body: any): Promise<InvokeEdgeResult> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body });

    // Supabase returned an error object
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
        success: false,
        reply: null,
        error: (error as any)?.name || 'unexpected_error',
        debug: {
          message: (error as any)?.message,
          status,
          context,
        },
      };
    }

    // If Supabase gave us a string, attempt to parse, otherwise return non_json_response
    if (typeof data === 'string') {
      const parsed = safeJsonParse(data);
      if (parsed) return parsed;

      console.error('[invokeEdge] Non-JSON string response', { functionName, raw: data });
      return { success: false, reply: null, error: 'non_json_response', debug: { raw: data } };
    }

    // If data looks like a Response-like object, try to read text/json safely
    // (Some environments may wrap it differently.)
    if (data && typeof data === 'object' && typeof (data as any).text === 'function') {
      try {
        const raw = await (data as any).text();
        const parsed = safeJsonParse(raw);
        if (parsed) return parsed;

        console.error('[invokeEdge] Response-like non-JSON', { functionName, raw });
        return { success: false, reply: null, error: 'non_json_response', debug: { raw } };
      } catch (e: any) {
        console.error('[invokeEdge] Failed reading Response-like body', { functionName, message: e?.message });
        return { success: false, reply: null, error: 'read_response_failed', debug: { message: e?.message } };
      }
    }

    // Normal case: data is already JSON
    return data;
  } catch (e: any) {
    console.error('[invokeEdge] exception', {
      functionName,
      message: e?.message,
      stack: e?.stack,
    });
    return { success: false, reply: null, error: 'invoke_exception', debug: { message: e?.message, stack: e?.stack } };
  }
}
