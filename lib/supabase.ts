
import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Global singleton instance - survives hot reloads
let supabaseInstance: SupabaseClient | null = null;
let isInitializing = false;

// Secure storage adapter for auth tokens
// Platform-specific: SecureStore for native, localStorage for web
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`[SecureStore] getItem error for key ${key}:`, error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`[SecureStore] setItem error for key ${key}:`, error);
    }
  },
  removeItem: async (key: string) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`[SecureStore] removeItem error for key ${key}:`, error);
    }
  },
};

/**
 * Get Supabase client instance (singleton)
 * Safe to call multiple times - always returns same instance
 * Survives hot reloads, re-renders, and provider re-mounts
 */
function getSupabaseClient(): SupabaseClient {
  // Return existing instance if already created
  if (supabaseInstance) {
    if (__DEV__) {
      console.log('♻️ Reusing existing Supabase client instance');
    }
    return supabaseInstance;
  }

  // Prevent concurrent initialization
  if (isInitializing) {
    if (__DEV__) {
      console.warn('⏳ Supabase client is initializing. Waiting...');
    }
    // Wait for initialization to complete instead of throwing
    // This prevents crashes during hot reload
    const maxWaitTime = 5000; // 5 seconds
    const startTime = Date.now();
    while (isInitializing && Date.now() - startTime < maxWaitTime) {
      // Busy wait (not ideal but safe for initialization)
    }
    if (supabaseInstance) {
      return supabaseInstance;
    }
    // If still not ready, fall through to create new instance
  }

  isInitializing = true;

  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

    // Validate environment variables
    if (!supabaseUrl || !supabaseAnonKey) {
      if (__DEV__) {
        console.warn(
          '⚠️ Supabase credentials missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY'
        );
      }
      // Return a placeholder to prevent crashes - auth will fail gracefully
      supabaseInstance = createClient('https://placeholder.supabase.co', 'placeholder-key', {
        auth: { persistSession: false },
      });
      return supabaseInstance;
    }

    // Create singleton instance ONCE with proper auth configuration
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true, // ✅ Auto-refresh tokens
        persistSession: true,   // ✅ Persist session across app restarts
        detectSessionInUrl: false, // Not needed for mobile
      },
    });

    if (__DEV__) {
      console.log('✅ Supabase client initialized with persistent auth storage');
    }

    return supabaseInstance;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Failed to initialize Supabase client:', error);
    }
    // Create a fallback instance to prevent crashes
    supabaseInstance = createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: { persistSession: false },
    });
    return supabaseInstance;
  } finally {
    isInitializing = false;
  }
}

/**
 * Get the Supabase client instance
 * This is the main export - use this everywhere
 * Lazy initialization ensures singleton is created only once
 */
export function getSupabase(): SupabaseClient {
  return getSupabaseClient();
}

/**
 * Export singleton instance for backward compatibility
 * This now uses lazy initialization via getter
 */
let _cachedSupabase: SupabaseClient | null = null;

export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    // Lazy initialize on first access
    if (!_cachedSupabase) {
      _cachedSupabase = getSupabaseClient();
    }
    return (_cachedSupabase as any)[prop];
  },
});

/**
 * Check if Supabase client is ready
 * Use this before making auth-dependent calls
 */
export function isSupabaseReady(): boolean {
  return supabaseInstance !== null && !isInitializing;
}

/**
 * Wait for Supabase client to be ready
 * Returns a promise that resolves when client is initialized
 */
export async function waitForSupabase(timeoutMs: number = 5000): Promise<SupabaseClient> {
  const startTime = Date.now();
  
  while (!isSupabaseReady() && Date.now() - startTime < timeoutMs) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (!isSupabaseReady()) {
    if (__DEV__) {
      console.warn('⚠️ Supabase client not ready after timeout, returning instance anyway');
    }
  }
  
  return getSupabaseClient();
}

/**
 * Reset Supabase instance (for testing only)
 * DO NOT use in production code
 */
export function __resetSupabaseInstance() {
  if (__DEV__) {
    console.log('🔄 Resetting Supabase instance (dev only)');
    supabaseInstance = null;
    _cachedSupabase = null;
    isInitializing = false;
  }
}
