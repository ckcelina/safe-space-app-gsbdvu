
/**
 * Supabase Client Configuration
 * 
 * Reads credentials ONLY from:
 * - process.env.EXPO_PUBLIC_SUPABASE_URL
 * - process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
 * 
 * Safe initialization:
 * - Logs warnings in development if credentials missing
 * - Never crashes the app
 * - Uses fallback values to prevent undefined errors
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Read ONLY from EXPO_PUBLIC_* environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Development-only validation warnings (non-blocking)
if (__DEV__) {
  if (!supabaseUrl) {
    console.warn('[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL environment variable');
    console.warn('[Supabase] App will continue with placeholder configuration');
  }
  if (!supabaseAnonKey) {
    console.warn('[Supabase] Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable');
    console.warn('[Supabase] App will continue with placeholder configuration');
  }
  if (supabaseUrl && supabaseAnonKey) {
    console.log('[Supabase] ✅ Configuration loaded successfully');
  }
}

// Create Supabase client with safe fallbacks
// Using placeholder values prevents "undefined" errors while allowing app to continue
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

/**
 * Check if Supabase is properly configured
 * Use this before making Supabase calls in your app
 */
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseAnonKey !== 'placeholder-anon-key');
};

/**
 * Get current Supabase configuration details
 */
export const getSupabaseConfig = () => {
  const isValid = isSupabaseConfigured();
  const problems: string[] = [];
  
  if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
    problems.push('EXPO_PUBLIC_SUPABASE_URL is not set');
  }
  if (!supabaseAnonKey || supabaseAnonKey === 'placeholder-anon-key') {
    problems.push('EXPO_PUBLIC_SUPABASE_ANON_KEY is not set');
  }
  
  return {
    url: supabaseUrl || null,
    anonKey: supabaseAnonKey ? '***' : null, // Never expose the actual key
    isValid,
    source: 'process.env.EXPO_PUBLIC_*',
    problems,
  };
};

/**
 * Export configuration status flags
 */
export const supabaseReady = isSupabaseConfigured();
export const supabaseConfigError = supabaseReady ? null : 'Supabase credentials not configured';
