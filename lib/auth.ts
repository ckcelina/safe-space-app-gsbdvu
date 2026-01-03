
/**
 * BetterAuth Client Configuration
 *
 * Uses centralized configuration from lib/supabase.ts
 * Gracefully handles missing backend URL
 */

import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getBackendUrl, isBackendConfigured } from "./supabase";

const API_URL = getBackendUrl();
const BEARER_TOKEN_KEY = "natively_bearer_token";

// Platform-specific storage adapter
const storage = Platform.OS === "web"
  ? {
      getItem: (key: string) => localStorage.getItem(key),
      setItem: (key: string, value: string) => localStorage.setItem(key, value),
      deleteItem: (key: string) => localStorage.removeItem(key),
    }
  : SecureStore;

// Only create auth client if backend is configured
let authClientInstance: ReturnType<typeof createAuthClient> | null = null;

function getAuthClient() {
  if (!authClientInstance && isBackendConfigured()) {
    authClientInstance = createAuthClient({
      baseURL: API_URL,
      plugins: [
        expoClient({
          scheme: "natively",
          storagePrefix: "natively",
          storage,
        }),
      ],
      ...(Platform.OS === "web" && {
        fetchOptions: {
          auth: {
            type: "Bearer" as const,
            token: () => localStorage.getItem(BEARER_TOKEN_KEY) || "",
          },
        },
      }),
    });
  }
  return authClientInstance;
}

// Export auth client with safe access
export const authClient = new Proxy({} as ReturnType<typeof createAuthClient>, {
  get(target, prop) {
    const client = getAuthClient();
    if (!client) {
      if (__DEV__) {
        console.warn('Auth client not available: Backend URL not configured');
      }
      return undefined;
    }
    const value = client[prop as keyof typeof client];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export function storeWebBearerToken(token: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(BEARER_TOKEN_KEY, token);
  }
}

export function clearAuthTokens() {
  if (Platform.OS === "web") {
    localStorage.removeItem(BEARER_TOKEN_KEY);
  }
}
