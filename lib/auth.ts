
/**
 * BetterAuth Client Configuration with Persistent Storage
 *
 * Features:
 * - Platform-specific storage (localStorage for web, SecureStore for native)
 * - Bearer token handling for web
 * - Expo client plugin for deep linking
 * - Session persistence across app reloads
 */

import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Backend URL from app.json
const API_URL = Constants.expoConfig?.extra?.backendUrl || "";
const BEARER_TOKEN_KEY = "natively_bearer_token";

// Platform-specific storage adapter with proper async handling
const storage = Platform.OS === "web"
  ? {
      getItem: (key: string) => localStorage.getItem(key),
      setItem: (key: string, value: string) => localStorage.setItem(key, value),
      deleteItem: (key: string) => localStorage.removeItem(key),
    }
  : {
      getItem: async (key: string) => {
        try {
          return await SecureStore.getItemAsync(key);
        } catch (error) {
          console.error(`SecureStore getItem error for key ${key}:`, error);
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          await SecureStore.setItemAsync(key, value);
        } catch (error) {
          console.error(`SecureStore setItem error for key ${key}:`, error);
        }
      },
      deleteItem: async (key: string) => {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (error) {
          console.error(`SecureStore deleteItem error for key ${key}:`, error);
        }
      },
    };

// Create auth client with persistent storage
export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: "natively",
      storagePrefix: "natively",
      storage,
    }),
  ],
  // Web-specific configuration for bearer tokens
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
 * Required for popup-based OAuth flow on web
 */
export function storeWebBearerToken(token: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(BEARER_TOKEN_KEY, token);
  }
}

/**
 * Clear stored authentication tokens
 * Only call this during explicit sign out
 */
export function clearAuthTokens() {
  if (Platform.OS === "web") {
    localStorage.removeItem(BEARER_TOKEN_KEY);
  }
}
