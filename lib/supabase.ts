
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// ============================================================================
// STRICT RUNTIME VALIDATION FOR SUPABASE CONFIGURATION
// ============================================================================

// Read environment variables (NO FALLBACK - we want to catch misconfigurations)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validation function
function validateSupabaseConfig(): { isValid: boolean; error?: string } {
  // Check if variables exist
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      isValid: false,
      error: 'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables',
    };
  }

  // Check if variables are not empty strings
  if (supabaseUrl.trim() === '' || supabaseAnonKey.trim() === '') {
    return {
      isValid: false,
      error: 'EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY cannot be empty',
    };
  }

  // Validate URL format
  if (!supabaseUrl.startsWith('https://')) {
    return {
      isValid: false,
      error: 'EXPO_PUBLIC_SUPABASE_URL must start with https://',
    };
  }

  if (!supabaseUrl.includes('supabase.co')) {
    return {
      isValid: false,
      error: 'EXPO_PUBLIC_SUPABASE_URL must contain "supabase.co"',
    };
  }

  return { isValid: true };
}

// Perform validation
const validation = validateSupabaseConfig();

// Log configuration status (DEV only)
if (__DEV__) {
  if (validation.isValid && supabaseUrl && supabaseAnonKey) {
    // Extract hostname from URL
    const urlHost = new URL(supabaseUrl).hostname;
    // Get last 6 characters of anon key
    const anonKeySuffix = supabaseAnonKey.slice(-6);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Supabase] ✅ Configuration validated successfully');
    console.log(`[Supabase] 🌐 urlHost=${urlHost}`);
    console.log(`[Supabase] 🔑 anon=…${anonKeySuffix}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } else {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('[Supabase] ❌ Configuration validation FAILED');
    console.error(`[Supabase] Error: ${validation.error}`);
    console.error('[Supabase] URL present:', !!supabaseUrl);
    console.error('[Supabase] Key present:', !!supabaseAnonKey);
    if (supabaseUrl) {
      console.error('[Supabase] URL value:', supabaseUrl);
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

// ============================================================================
// CREATE SUPABASE CLIENT
// ============================================================================

// If validation fails, create a non-functional placeholder client
// This prevents import errors but ensures the app shows the configuration screen
if (!validation.isValid) {
  console.error('[Supabase] ⚠️  Configuration invalid - creating non-functional placeholder client');
  console.error('[Supabase] ⚠️  App will display configuration instructions');
  
  // Create a dummy client that will fail gracefully
  // Using obviously invalid values to prevent accidental usage
  export const supabase = createClient(
    'https://invalid-config.supabase.co',
    'invalid-anon-key-placeholder',
    {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );

  export const isSupabaseReady = () => false;
  export const supabaseConfigError = validation.error;
} else {
  // ============================================================================
  // VALID CONFIGURATION - CREATE PRODUCTION CLIENT
  // ============================================================================
  
  export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // Only detect session in URL on web platform
      // This prevents missing auth tokens when invoking Edge Functions on web preview
      detectSessionInUrl: Platform.OS === 'web',
    },
  });

  // Export helper functions
  export const isSupabaseReady = () => true;
  export const supabaseConfigError = undefined;

  // Log successful initialization (DEV only)
  if (__DEV__) {
    console.log('[Supabase] ✅ Client initialized and ready for use');
    console.log('[Supabase] ✅ Auth session persistence: ENABLED');
    console.log('[Supabase] ✅ Auto token refresh: ENABLED');
    console.log(`[Supabase] ✅ Session URL detection: ${Platform.OS === 'web' ? 'ENABLED (web)' : 'DISABLED (native)'}`);
  }
}

// Export configuration details for debugging
export const getSupabaseConfig = () => ({
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  isValid: validation.isValid,
  error: validation.error,
  platform: Platform.OS,
});
