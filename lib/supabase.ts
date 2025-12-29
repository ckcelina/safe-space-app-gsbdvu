
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
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

// Perform validation at module load time (once)
const validation = validateSupabaseConfig();

// ============================================================================
// CREATE SUPABASE CLIENT OR NULL
// ============================================================================

let supabase: SupabaseClient | null = null;
let supabaseReady = false;
let supabaseConfigError: string | undefined = undefined;

if (!validation.isValid) {
  // Configuration is invalid - do NOT create a client
  console.warn('[Supabase] Missing env vars');
  console.warn(`[Supabase] ${validation.error}`);
  
  supabase = null;
  supabaseReady = false;
  supabaseConfigError = validation.error;

  // Log detailed status in DEV
  if (__DEV__) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('[Supabase] ❌ Configuration validation FAILED');
    console.error(`[Supabase] Error: ${validation.error}`);
    console.error('[Supabase] URL present:', !!supabaseUrl);
    console.error('[Supabase] Key present:', !!supabaseAnonKey);
    if (supabaseUrl) {
      console.error('[Supabase] URL value:', supabaseUrl);
    }
    console.error('[Supabase] supabase = null');
    console.error('[Supabase] supabaseReady = false');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
} else {
  // ============================================================================
  // VALID CONFIGURATION - CREATE PRODUCTION CLIENT
  // ============================================================================
  
  supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // Only detect session in URL on web platform
      // This prevents missing auth tokens when invoking Edge Functions on web preview
      detectSessionInUrl: Platform.OS === 'web',
    },
  });

  supabaseReady = true;
  supabaseConfigError = undefined;

  // Log successful initialization (DEV only)
  if (__DEV__) {
    // Extract hostname from URL
    const urlHost = new URL(supabaseUrl).hostname;
    // Get last 6 characters of anon key
    const anonKeySuffix = supabaseAnonKey.slice(-6);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Supabase] ✅ Configuration validated successfully');
    console.log(`[Supabase] 🌐 urlHost=${urlHost}`);
    console.log(`[Supabase] 🔑 anon=…${anonKeySuffix}`);
    console.log('[Supabase] ✅ Client initialized and ready for use');
    console.log('[Supabase] ✅ Auth session persistence: ENABLED');
    console.log('[Supabase] ✅ Auto token refresh: ENABLED');
    console.log(`[Supabase] ✅ Session URL detection: ${Platform.OS === 'web' ? 'ENABLED (web)' : 'DISABLED (native)'}`);
    console.log('[Supabase] supabaseReady = true');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { supabase, supabaseReady, supabaseConfigError };

// Export configuration details for debugging
export const getSupabaseConfig = () => ({
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  isValid: validation.isValid,
  error: validation.error,
  platform: Platform.OS,
});
