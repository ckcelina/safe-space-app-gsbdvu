
import { supabase } from '../supabase';

export interface InvokeEdgeError {
  success: false;
  reply: null;
  error: string;
  debug?: any;
}
type InvokeEdgeResult = any | InvokeEdgeError;

function safeJsonParse(text: string) {
  try { return JSON.parse(text); } catch { return null; }
}

export async function copyDebugToClipboard(text: string): Promise<boolean> {
  try {
    const t = typeof text === 'string' ? text : JSON.stringify(text, null, 2);
    const nav: any = (globalThis as any)?.navigator;
    if (nav?.clipboard?.writeText) { await nav.clipboard.writeText(t); return true; }
    console.warn('[copyDebugToClipboard] Clipboard API not available.');
    return false;
  } catch (e: any) {
    console.warn('[copyDebugToClipboard] Failed', { message: e?.message });
    return false;
  }
}

export async function invokeEdge(functionName: string, body: any): Promise<InvokeEdgeResult> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body });

    if (error) {
      const status = (error as any)?.status;
      const context = (error as any)?.context;
      console.error('[invokeEdge] invoke error', { functionName, message: (error as any)?.message, status, context });
      return { success: false, reply: null, error: (error as any)?.name || 'unexpected_error', debug: { message: (error as any)?.message, status, context } };
    }

    if (typeof data === 'string') {
      const parsed = safeJsonParse(data);
      if (parsed) return parsed;
      console.error('[invokeEdge] non-json string', { functionName, raw: data });
      return { success: false, reply: null, error: 'non_json_response', debug: { raw: data } };
    }

    return data;
  } catch (e: any) {
    console.error('[invokeEdge] exception', { functionName, message: e?.message, stack: e?.stack });
    return { success: false, reply: null, error: 'invoke_exception', debug: { message: e?.message, stack: e?.stack } };
  }
}
