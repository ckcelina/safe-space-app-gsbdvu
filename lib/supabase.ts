
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ============================================================================
// ROBUST SUPABASE CONFIGURATION WITH MULTIPLE SOURCES
// ============================================================================

/**
 * Configuration result interface
 */
export interface SupabaseConfig {
  url?: string;
  anonKey?: string;
  isValid: boolean;
  problems: string[];
  source: 'env' | 'extra' | null;
}

/**
 * Get Supabase configuration from multiple sources with fallbacks
 * Priority: process.env → Constants.expoConfig.extra
 */
export function getSupabaseConfig(): SupabaseConfig {
  const problems: string[] = [];
  let url: string | undefined;
  let anonKey: string | undefined;
  let source: 'env' | 'extra' | null = null;

  // ═══════════════════════════════════════════════════════════════════
  // SOURCE 1: Read from process.env (primary source)
  // ═══════════════════════════════════════════════════════════════════
  const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const envAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (envUrl && envAnonKey) {
    url = envUrl;
    anonKey = envAnonKey;
    source = 'env';
    
    if (__DEV__) {
      console.log('[Supabase Config] ✅ Found credentials in process.env');
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // SOURCE 2: Fallback to Constants.expoConfig.extra (for preview environments)
  // ═══════════════════════════════════════════════════════════════════
  if (!url || !anonKey) {
    // Try EXPO_PUBLIC_ prefixed keys first
    const extraUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
    const extraAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (extraUrl && extraAnonKey) {
      url = extraUrl;
      anonKey = extraAnonKey;
      source = 'extra';
      
      if (__DEV__) {
        console.log('[Supabase Config] ✅ Found credentials in Constants.expoConfig.extra (EXPO_PUBLIC_ prefix)');
      }
    } else {
      // Try without EXPO_PUBLIC_ prefix (legacy support)
      const legacyUrl = Constants.expoConfig?.extra?.supabaseUrl;
      const legacyAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

      if (legacyUrl && legacyAnonKey) {
        url = legacyUrl;
        anonKey = legacyAnonKey;
        source = 'extra';
        
        if (__DEV__) {
          console.log('[Supabase Config] ✅ Found credentials in Constants.expoConfig.extra (legacy keys)');
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // VALIDATION: Check if credentials exist
  // ═══════════════════════════════════════════════════════════════════
  if (!url) {
    problems.push('Missing EXPO_PUBLIC_SUPABASE_URL');
  }
  if (!anonKey) {
    problems.push('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }

  // ═══════════════════════════════════════════════════════════════════
  // VALIDATION: Normalize and validate URL format
  // ═══════════════════════════════════════════════════════════════════
  if (url) {
    // Trim whitespace
    url = url.trim();

    // Check if URL starts with https://
    if (!url.startsWith('https://')) {
      problems.push('EXPO_PUBLIC_SUPABASE_URL must start with https://');
    }

    // Check if URL contains supabase.co (basic sanity check)
    if (!url.includes('supabase.co')) {
      problems.push('EXPO_PUBLIC_SUPABASE_URL must contain "supabase.co"');
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // VALIDATION: Validate anon key is non-empty
  // ═══════════════════════════════════════════════════════════════════
  if (anonKey) {
    // Trim whitespace
    anonKey = anonKey.trim();

    // Check if key is empty after trimming
    if (anonKey.length === 0) {
      problems.push('EXPO_PUBLIC_SUPABASE_ANON_KEY cannot be empty');
    }
  }

  const isValid = problems.length === 0;

  return {
    url,
    anonKey,
    isValid,
    problems,
    source,
  };
}

// ============================================================================
// INITIALIZE CONFIGURATION AT MODULE LOAD TIME
// ============================================================================
const config = getSupabaseConfig();

// ============================================================================
// CREATE SUPABASE CLIENT OR NULL
// ============================================================================
let supabase: SupabaseClient | null = null;

if (!config.isValid) {
  // Configuration is invalid - do NOT create a client
  if (__DEV__) {
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.warn('[Supabase] ❌ Configuration validation FAILED');
    console.warn('[Supabase] Problems:', config.problems);
    console.warn('[Supabase] URL present:', !!config.url);
    console.warn('[Supabase] Key present:', !!config.anonKey);
    console.warn('[Supabase] Source:', config.source || 'none');
    if (config.url) {
      console.warn('[Supabase] URL value:', config.url);
    }
    console.warn('[Supabase] supabase = null');
    console.warn('[Supabase] supabaseReady = false');
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
  
  supabase = null;
} else {
  // ═══════════════════════════════════════════════════════════════════
  // VALID CONFIGURATION - CREATE PRODUCTION CLIENT
  // ═══════════════════════════════════════════════════════════════════
  
  supabase = createClient(config.url!, config.anonKey!, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // Only detect session in URL on web platform
      // This prevents missing auth tokens when invoking Edge Functions on web preview
      detectSessionInUrl: Platform.OS === 'web',
    },
  });

  // Log successful initialization (DEV only)
  if (__DEV__) {
    try {
      // Extract hostname from URL
      const urlHost = new URL(config.url!).hostname;
      // Get last 6 characters of anon key
      const anonKeySuffix = config.anonKey!.slice(-6);
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[Supabase] ✅ Configuration validated successfully');
      console.log(`[Supabase] 🌐 urlHost=${urlHost}`);
      console.log(`[Supabase] 🔑 anon=…${anonKeySuffix}`);
      console.log(`[Supabase] 📍 source=${config.source}`);
      console.log('[Supabase] ✅ Client initialized and ready for use');
      console.log('[Supabase] ✅ Auth session persistence: ENABLED');
      console.log('[Supabase] ✅ Auto token refresh: ENABLED');
      console.log(`[Supabase] ✅ Session URL detection: ${Platform.OS === 'web' ? 'ENABLED (web)' : 'DISABLED (native)'}`);
      console.log('[Supabase] supabaseReady = true');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (e) {
      console.log('[Supabase] ✅ Client initialized (could not parse URL for logging)');
    }
  }
}

// ============================================================================
// READINESS FUNCTION
// ============================================================================

/**
 * Check if Supabase is properly configured and ready to use
 * @returns true if Supabase client is initialized and ready
 */
export function isSupabaseReady(): boolean {
  return config.isValid && supabase !== null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { supabase };

/**
 * Boolean flag indicating if Supabase is ready
 * Computed from isSupabaseReady() for convenience
 */
export const supabaseReady = isSupabaseReady();

/**
 * Configuration error message (if any)
 */
export const supabaseConfigError = config.isValid ? undefined : config.problems.join(', ');
