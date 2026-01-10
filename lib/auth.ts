
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Get configuration from environment variables
const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL || "";
const APP_SCHEME = process.env.EXPO_PUBLIC_APP_SCHEME || "natively";
const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || "natively";
const BEARER_TOKEN_KEY = `${APP_NAME}_bearer_token`;

// Platform-specific storage adapter
const storage = Platform.OS === "web"
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
      scheme: APP_SCHEME,
      storagePrefix: APP_NAME,
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
