// lib/supabase/invokeEdge.ts
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

function toDebugString(debugInfo: any) {
  if (debugInfo == null) return '';
  if (typeof debugInfo === 'string') return debugInfo;
  try {
    return JSON.stringify(debugInfo, null, 2);
  } catch {
    return String(debugInfo);
  }
}

/**
 * Chat uses this when user taps: "AI error (tap to copy debug)".
 * Must exist + must not crash. NO expo-clipboard dependency.
 */
export async function copyDebugToClipboard(debugInfo: any): Promise<boolean> {
  try {
    const text = toDebugString(debugInfo);
    if (!text) return false;

    const nav: any = (globalThis as any)?.navigator;
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      return true;
    }

    // Native fallback (no dependency): no-op, but do not crash
    console.warn('[copyDebugToClipboard] Clipboard not available on this platform. Debug:', text);
    return false;
  } catch (e: any) {
    console.warn('[copyDebugToClipboard] failed', e?.message);
    return false;
  }
}

function getSupabaseUrl(): string | undefined {
  return (
    (supabase as any)?.supabaseUrl ||
    (supabase as any)?.url ||
    (process as any)?.env?.EXPO_PUBLIC_SUPABASE_URL
  );
}

function getSupabaseAnonKey(): string | undefined {
  return (process as any)?.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY;
}

async function fetchEdgeRaw(functionName: string, body: any) {
  const SUPABASE_URL = getSupabaseUrl();
  const SUPABASE_ANON_KEY = getSupabaseAnonKey();

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return {
      ok: false,
      status: 0,
      statusText: 'missing_supabase_env',
      url: null,
      raw: '',
      parsed: null,
      missing: {
        SUPABASE_URL: !SUPABASE_URL,
        SUPABASE_ANON_KEY: !SUPABASE_ANON_KEY,
      },
    };
  }

  const url = `${String(SUPABASE_URL).replace(/\/$/, '')}/functions/v1/${functionName}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body ?? {}),
      signal: controller.signal,
    });

    const raw = await res.text();
    const parsed = safeJsonParse(raw);

    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      url,
      raw,
      parsed,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function invokeEdge(functionName: string, body: any): Promise<InvokeEdgeResult> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body });

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

      // Fallback fetch for real HTTP status + raw text
      try {
        const fallback = await fetchEdgeRaw(functionName, body);

        console.error('[invokeEdge] fallback fetch result', {
          functionName,
          url: fallback.url,
          status: fallback.status,
          statusText: fallback.statusText,
          ok: fallback.ok,
          rawPreview: (fallback.raw || '').slice(0, 500),
          missing: (fallback as any).missing,
        });

        if (fallback.parsed) return fallback.parsed;

        return {
          success: false,
          reply: null,
          error: (error as any)?.name || 'invocation_failed',
          debug: {
            message: (error as any)?.message,
            status,
            context,
            fallback,
          },
        };
      } catch (e2: any) {
        console.error('[invokeEdge] fallback fetch failed', {
          functionName,
          message: e2?.message,
          stack: e2?.stack,
        });

        return {
          success: false,
          reply: null,
          error: (error as any)?.name || 'invocation_failed',
          debug: {
            message: (error as any)?.message,
            status,
            context,
            fallbackError: { message: e2?.message, stack: e2?.stack },
          },
        };
      }
    }

    if (typeof data === 'string') {
      const parsed = safeJsonParse(data);
      if (parsed) return parsed;

      console.error('[invokeEdge] Non-JSON string response', { functionName, raw: data });
      return { success: false, reply: null, error: 'non_json_response', debug: { raw: data } };
    }

    return data;
  } catch (e: any) {
    console.error('[invokeEdge] exception', {
      functionName,
      message: e?.message,
      stack: e?.stack,
    });

    // Fallback fetch for exceptions too
    try {
      const fallback = await fetchEdgeRaw(functionName, body);

      console.error('[invokeEdge] exception fallback fetch result', {
        functionName,
        url: fallback.url,
        status: fallback.status,
        statusText: fallback.statusText,
        ok: fallback.ok,
        rawPreview: (fallback.raw || '').slice(0, 500),
        missing: (fallback as any).missing,
      });

      if (fallback.parsed) return fallback.parsed;

      return {
        success: false,
        reply: null,
        error: 'invoke_exception',
        debug: { message: e?.message, stack: e?.stack, fallback },
      };
    } catch (e2: any) {
      return {
        success: false,
        reply: null,
        error: 'invoke_exception',
        debug: {
          message: e?.message,
          stack: e?.stack,
          fallbackError: { message: e2?.message, stack: e2?.stack },
        },
      };
    }
  }
}
