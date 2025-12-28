
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Alert } from 'react-native';

// Environment variables with validation
// Read values from process.env
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Validate environment variables at startup
if (!supabaseUrl || !supabaseAnonKey) {
  console.log('[Supabase] Missing environment variables!');
  console.log('[Supabase] URL:', supabaseUrl ? 'Present' : 'MISSING');
  console.log('[Supabase] Key:', supabaseAnonKey ? 'Present' : 'MISSING');
  
  // Show user-friendly error instead of crashing
  setTimeout(() => {
    Alert.alert(
      'Configuration Error',
      'The app is missing required configuration. Please contact support.',
      [{ text: 'OK' }]
    );
  }, 1000);
} else {
  // Log successful configuration (dev only)
  if (__DEV__) {
    const usingEnvVars = !!process.env.EXPO_PUBLIC_SUPABASE_URL;
    console.log(`[Supabase] Configuration source: ${usingEnvVars ? 'Environment variables' : 'Hardcoded fallback'}`);
  }
}

// Create and export a single Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Log successful initialization
console.log('[Supabase] Client initialized successfully');

// Export a function to check if client is ready
export const isSupabaseReady = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabase);
};
