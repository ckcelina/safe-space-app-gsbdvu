
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Alert } from 'react-native';

// Environment variables with validation
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zjzvkxvahrbuuyzjzxol.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZreHZhaHJidXV5emp6eG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzQ0MjMsImV4cCI6MjA4MDQxMDQyM30.TrjFcA0HEbA6ocLLlbadS0RwuEjKU0ttnacGXyEk1M8';

// Validate environment variables at startup
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing environment variables!');
  console.error('[Supabase] URL:', supabaseUrl ? 'Present' : 'MISSING');
  console.error('[Supabase] Key:', supabaseAnonKey ? 'Present' : 'MISSING');
  
  // Show user-friendly error instead of crashing
  setTimeout(() => {
    Alert.alert(
      'Configuration Error',
      'The app is missing required configuration. Please contact support.',
      [{ text: 'OK' }]
    );
  }, 1000);
}

// Log configuration source (dev only)
if (__DEV__) {
  const usingEnvVars = !!process.env.EXPO_PUBLIC_SUPABASE_URL;
  console.log(`[Supabase] Configuration source: ${usingEnvVars ? 'Environment variables' : 'Hardcoded fallback'}`);
}

/**
 * Singleton Supabase client instance
 * 
 * CRITICAL: This client is initialized ONCE and reused throughout the app.
 * Do NOT create multiple clients - it will break session persistence.
 * 
 * Features:
 * - AsyncStorage persistence: Sessions survive app restarts
 * - Auto token refresh: Tokens refresh automatically before expiry
 * - Session restoration: onAuthStateChange fires on app load with persisted session
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

console.log('[Supabase] Client initialized successfully with AsyncStorage persistence');

/**
 * Check if Supabase client is properly configured
 */
export const isSupabaseReady = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabase);
};
