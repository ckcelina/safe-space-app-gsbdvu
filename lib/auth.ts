
/**
 * BetterAuth Client Configuration
 *
 * Enhanced with:
 * - Backend URL validation (HTTPS check)
 * - Dev-only warnings for missing configuration
 * - Timeout handling for auth operations
 * - Robust error logging
 */

import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Backend URL configuration
const API_URL = Constants.expoConfig?.extra?.backendUrl || "";
const BEARER_TOKEN_KEY = "natively_bearer_token";

// Validation and logging
const validateBackendUrl = (): { isValid: boolean; warning: string | null } => {
  if (!API_URL || API_URL.trim() === "") {
    return {
      isValid: false,
      warning: "⚠️ Backend URL not configured in app.json. Auth will fail.",
    };
  }

  // Check for HTTPS (required on iOS for production)
  if (Platform.OS === "ios" && !API_URL.startsWith("https://") && !__DEV__) {
    return {
      isValid: false,
      warning: "⚠️ Backend URL must use HTTPS on iOS in production mode.",
    };
  }

  // Check for localhost/development URLs
  if (API_URL.includes("localhost") || API_URL.includes("127.0.0.1")) {
    if (Platform.OS !== "web") {
      return {
        isValid: false,
        warning:
          "⚠️ localhost URLs don't work on native devices. Use your computer's IP address or ngrok.",
      };
    }
  }

  return { isValid: true, warning: null };
};

// Log configuration status (dev only)
if (__DEV__) {
  const validation = validateBackendUrl();
  if (validation.warning) {
    console.warn("[Auth Config]", validation.warning);
  } else {
    // Log host only, not full URL (security)
    const host = API_URL ? new URL(API_URL).host : "none";
    console.log("[Auth Config] Backend host:", host);
  }
}

// Platform-specific storage adapter
const storage =
  Platform.OS === "web"
    ? {
        getItem: (key: string) => localStorage.getItem(key),
        setItem: (key: string, value: string) => localStorage.setItem(key, value),
        deleteItem: (key: string) => localStorage.removeItem(key),
      }
    : SecureStore;

// Create auth client with platform-specific configuration
export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: "natively",
      storagePrefix: "natively",
      storage,
    }),
  ],
  // Web-specific configuration to handle bearer tokens
  ...(Platform.OS === "web" && {
    fetchOptions: {
      auth: {
        type: "Bearer" as const,
        token: () => localStorage.getItem(BEARER_TOKEN_KEY) || "",
      },
    },
  }),
});

/**
 * Store bearer token for web authentication
 */
export function storeWebBearerToken(token: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(BEARER_TOKEN_KEY, token);
  }
}

/**
 * Clear stored authentication tokens
 */
export function clearAuthTokens() {
  if (Platform.OS === "web") {
    localStorage.removeItem(BEARER_TOKEN_KEY);
  }
}

/**
 * Check if backend is properly configured
 */
export function isBackendConfigured(): boolean {
  return validateBackendUrl().isValid;
}

/**
 * Get backend configuration status for error messages
 */
export function getBackendStatus(): {
  configured: boolean;
  url: string;
  warning: string | null;
} {
  const validation = validateBackendUrl();
  return {
    configured: validation.isValid,
    url: API_URL,
    warning: validation.warning,
  };
}

/**
 * Timeout wrapper for auth operations
 * Prevents hanging on network issues
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 15000,
  operation: string = "Auth operation"
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error: any) {
    // Enhanced error logging
    const validation = validateBackendUrl();
    
    if (!validation.isValid) {
      console.error("[Auth Error] Configuration issue:", validation.warning);
      throw new Error(validation.warning || "Backend not configured");
    }

    if (error.message?.includes("timeout")) {
      console.error("[Auth Error] Timeout:", operation);
      throw new Error("Connection timeout. Please check your internet connection.");
    }

    if (error.message?.includes("Network request failed")) {
      console.error("[Auth Error] Network failure:", operation);
      throw new Error("Connection issue. Please try again.");
    }

    if (error.message?.includes("Failed to fetch")) {
      console.error("[Auth Error] Fetch failed:", operation);
      throw new Error("Unable to reach server. Please check your connection.");
    }

    // Re-throw original error with context
    console.error("[Auth Error]", operation, "failed:", error.message);
    throw error;
  }
}
