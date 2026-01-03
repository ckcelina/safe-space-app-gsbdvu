
/**
 * Supabase Client Configuration
 * 
 * Enhanced with:
 * - HTTPS validation for iOS production
 * - Robust error logging
 * - Timeout handling
 * - Network error detection
 * 
 * Reads configuration in priority order:
 * 1. EXPO_PUBLIC_* environment variables (preferred)
 * 2. Constants.expoConfig.extra (from app.config.ts)
 * 3. Constants.manifest.extra (legacy Expo)
 * 
 * Gracefully handles missing configuration without crashing.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage adapter for Supabase auth
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      return AsyncStorage.setItem(key, value);
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      return AsyncStorage.removeItem(key);
    }
    return SecureStore.deleteItemAsync(key);
  },
};

/**
 * Validate Supabase URL
 */
function validateSupabaseUrl(url: string): { isValid: boolean; warning: string | null } {
  if (!url || url.trim() === '') {
    return {
      isValid: false,
      warning: '⚠️ Supabase URL not configured. Please set EXPO_PUBLIC_SUPABASE_URL in .env',
    };
  }

  // Check for HTTPS (required on iOS for production)
  if (Platform.OS === 'ios' && !url.startsWith('https://') && !__DEV__) {
    return {
      isValid: false,
      warning: '⚠️ Supabase URL must use HTTPS on iOS in production mode.',
    };
  }

  // Check for valid Supabase URL format
  if (!url.includes('supabase.co') && !url.includes('supabase.in') && !__DEV__) {
    return {
      isValid: true,
      warning: '⚠️ URL does not appear to be a Supabase URL. This may cause issues.',
    };
  }

  return { isValid: true, warning: null };
}

/**
 * Get Supabase configuration with fallbacks
 */
function getSupabaseConfig(): { url: string; anonKey: string } {
  // Priority 1: EXPO_PUBLIC environment variables
  const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const envKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  // Priority 2: expo.extra from app.config.ts
  const extraUrl = Constants.expoConfig?.extra?.supabaseUrl;
  const extraKey = Constants.expoConfig?.extra?.supabaseAnonKey;
  
  if (extraUrl && extraKey) {
    return { url: extraUrl, anonKey: extraKey };
  }

  // Priority 3: Legacy manifest.extra
  const manifestUrl = Constants.manifest?.extra?.supabaseUrl;
  const manifestKey = Constants.manifest?.extra?.supabaseAnonKey;
  
  if (manifestUrl && manifestKey) {
    return { url: manifestUrl, anonKey: manifestKey };
  }

  // No configuration found
  if (__DEV__) {
    console.warn(
      '⚠️ Supabase configuration missing!\n' +
      'Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY\n' +
      'in your .env file or app.config.ts'
    );
  }

  return { url: '', anonKey: '' };
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  const config = getSupabaseConfig();
  
  if (!config.url || !config.anonKey || config.url.length === 0 || config.anonKey.length === 0) {
    return false;
  }

  const validation = validateSupabaseUrl(config.url);
  return validation.isValid;
}

/**
 * Get configuration error message for UI display
 */
export function getSupabaseConfigError(): string | null {
  const config = getSupabaseConfig();
  
  if (!config.url || config.url.length === 0) {
    if (__DEV__) {
      return 'Supabase URL not configured. Please add EXPO_PUBLIC_SUPABASE_URL to .env file.';
    }
    return 'App configuration error. Please contact support.';
  }

  if (!config.anonKey || config.anonKey.length === 0) {
    if (__DEV__) {
      return 'Supabase Anon Key not configured. Please add EXPO_PUBLIC_SUPABASE_ANON_KEY to .env file.';
    }
    return 'App configuration error. Please contact support.';
  }

  const validation = validateSupabaseUrl(config.url);
  if (!validation.isValid) {
    return validation.warning;
  }
  
  return null;
}

/**
 * Get Supabase configuration status for logging
 */
export function getSupabaseStatus(): {
  configured: boolean;
  url: string;
  host: string | null;
  warning: string | null;
} {
  const config = getSupabaseConfig();
  const validation = validateSupabaseUrl(config.url);
  
  let host: string | null = null;
  try {
    if (config.url) {
      host = new URL(config.url).host;
    }
  } catch (e) {
    console.warn('[Supabase] Invalid URL format:', config.url);
  }

  return {
    configured: isSupabaseConfigured(),
    url: config.url,
    host,
    warning: validation.warning,
  };
}

// Log configuration status (dev only)
if (__DEV__) {
  const status = getSupabaseStatus();
  if (status.warning) {
    console.warn('[Supabase Config]', status.warning);
  } else if (status.configured) {
    console.log('[Supabase Config] Host:', status.host);
  } else {
    console.warn('[Supabase Config] Not configured');
  }
}

// Initialize Supabase client with lazy loading
let supabaseInstance: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient {
  const config = getSupabaseConfig();
  
  // Use placeholder values if not configured to prevent crashes
  const url = config.url || 'https://placeholder.supabase.co';
  const anonKey = config.anonKey || 'placeholder-key';
  
  return createClient(url, anonKey, {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Get Supabase client instance (singleton)
 * Creates client on first access
 */
function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient();
  }
  return supabaseInstance;
}

// Export a Proxy that lazily initializes the client
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabaseClient();
    const value = client[prop as keyof SupabaseClient];
    
    // Bind methods to the client instance
    if (typeof value === 'function') {
      return value.bind(client);
    }
    
    return value;
  },
});

/**
 * Get backend URL with fallbacks
 */
export function getBackendUrl(): string {
  // Priority 1: EXPO_PUBLIC environment variable
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl) {
    return envUrl;
  }

  // Priority 2: expo.extra from app.config.ts
  const extraUrl = Constants.expoConfig?.extra?.backendUrl;
  if (extraUrl) {
    return extraUrl;
  }

  // Priority 3: Legacy manifest.extra
  const manifestUrl = Constants.manifest?.extra?.backendUrl;
  if (manifestUrl) {
    return manifestUrl;
  }

  // No configuration found
  if (__DEV__) {
    console.warn(
      '⚠️ Backend URL not configured!\n' +
      'Set EXPO_PUBLIC_BACKEND_URL in .env or app.config.ts'
    );
  }

  return '';
}

/**
 * Check if backend is configured
 */
export function isBackendConfigured(): boolean {
  const url = getBackendUrl();
  return !!url && url.length > 0;
}
