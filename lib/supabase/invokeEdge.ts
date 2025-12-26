// lib/supabase/invokeEdge.ts

import { supabase } from "../supabase";

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

// IMPORTANT: chat.tsx expects this to exist.
// No expo-clipboard dependency — best-effort only.
export async function copyDebugToClipboard(debugInfo: any) {
  const text = typeof debugInfo === "string" ? debugInfo : JSON.stringify(debugInfo, null, 2);

  try {
    // Web-like environments
    if (typeof navigator !== "undefined" && (navigator as any)?.clipboard?.writeText) {
      await (navigator as any).clipboard.writeText(text);
      return true;
    }
  } catch {
    // ignore
  }

  // Fallback: at least don't crash
  console.log("[copyDebugToClipboard] Clipboard unavailable. Debug info:", text);
  return false;
}

export async function invokeEdge(functionName: string, body: any): Promise<InvokeEdgeResult> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body });

    if (error) {
      const status = (error as any)?.status;
      const context = (error as any)?.context;

      console.error("[invokeEdge] supabase.functions.invoke error", {
        functionName,
        name: (error as any)?.name,
        message: (error as any)?.message,
        status,
        context,
      });

      return {
        success: false,
        reply: null,
        error: (error as any)?.name || "unexpected_error",
        debug: {
          message: (error as any)?.message,
          status,
          context,
        },
      };
    }

    if (typeof data === "string") {
      const parsed = safeJsonParse(data);
      if (parsed) return parsed;

      console.error("[invokeEdge] Non-JSON string response", { functionName, raw: data });
      return { success: false, reply: null, error: "non_json_response", debug: { raw: data } };
    }

    // Sometimes wrappers return a Response-like object
    if (data && typeof data === "object" && typeof (data as any).text === "function") {
      try {
        const raw = await (data as any).text();
        const parsed = safeJsonParse(raw);
        if (parsed) return parsed;

        console.error("[invokeEdge] Response-like non-JSON", { functionName, raw });
        return { success: false, reply: null, error: "non_json_response", debug: { raw } };
      } catch (e: any) {
        console.error("[invokeEdge] Failed reading Response-like body", { functionName, message: e?.message });
        return { success: false, reply: null, error: "read_response_failed", debug: { message: e?.message } };
      }
    }

    return data;
  } catch (e: any) {
    console.error("[invokeEdge] exception", { functionName, message: e?.message, stack: e?.stack });
    return { success: false, reply: null, error: "invoke_exception", debug: { message: e?.message, stack: e?.stack } };
  }
}
