
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUPABASE CLIENT INITIALIZATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// ENVIRONMENT VARIABLES:
// - EXPO_PUBLIC_SUPABASE_URL: Your Supabase project URL
// - EXPO_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous/public key
//
// IMPORTANT: These must be prefixed with EXPO_PUBLIC_ to be available at runtime
// in Expo Go, Natively Preview, and production builds.
//
// FALLBACK BEHAVIOR:
// If either variable is missing or empty, a fallback client is created that:
// - Returns graceful errors instead of crashing
// - Logs warnings in development mode only
// - Allows the app to render the configuration error screen
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Read environment variables - ensure they are non-empty strings
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

// Validate that both values are non-empty strings
const hasValidUrl = typeof supabaseUrl === 'string' && supabaseUrl.length > 0;
const hasValidAnonKey = typeof supabaseAnonKey === 'string' && supabaseAnonKey.length > 0;
const hasSupabaseConfig = hasValidUrl && hasValidAnonKey;

const missingConfigMessage =
  'Missing Supabase configuration. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment variables.';

let hasLoggedMissingConfigWarning = false;

// Helper function to return a graceful error response
const resolveMissingConfig = async () => {
  const error = new Error(missingConfigMessage);
  if (__DEV__ && !hasLoggedMissingConfigWarning) {
    console.warn('[Supabase] Configuration missing - operations will fail gracefully');
    hasLoggedMissingConfigWarning = true;
  }

  return { data: null, error };
};

// Create a query builder stub that always returns the missing config error
const createQueryBuilderStub = () => {
  const handler: ProxyHandler<any> = {
    apply: () => resolveMissingConfig(),
    get: () => builder,
  };

  const builder = new Proxy(resolveMissingConfig as any, handler);
  return builder;
};

// Create a fallback Supabase client that doesn't crash when config is missing
const createSupabaseFallback = (): SupabaseClient<any, any, any> =>
  ({
    auth: new Proxy({}, { get: () => resolveMissingConfig }),
    from: () => createQueryBuilderStub(),
    channel: () => createQueryBuilderStub(),
    rpc: () => resolveMissingConfig(),
    functions: {
      invoke: () => resolveMissingConfig(),
    },
  } as unknown as SupabaseClient<any, any, any>);

// Initialize the Supabase client - either real or fallback
const supabaseClient = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : createSupabaseFallback();

// Log configuration status only in development mode
if (__DEV__) {
  console.log('[Supabase] Environment variable check:');
  console.log(`  - EXPO_PUBLIC_SUPABASE_URL: ${hasValidUrl ? '✅ Present' : '❌ MISSING'}`);
  console.log(`  - EXPO_PUBLIC_SUPABASE_ANON_KEY: ${hasValidAnonKey ? '✅ Present' : '❌ MISSING'}`);
  
  if (hasSupabaseConfig) {
    console.log('[Supabase] ✅ Client initialized successfully');
  } else {
    console.warn('[Supabase] ⚠️  Configuration incomplete!');
    console.warn('[Supabase] App will show configuration error screen');
    console.warn('[Supabase] To fix: Add environment variables in Natively dashboard');
  }
}

// Export the Supabase client (real or fallback)
export const supabase = supabaseClient;

// Export a function to check if client is ready
export const isSupabaseReady = () => hasSupabaseConfig;

// Export configuration status for use in UI
export const supabaseConfigStatus = {
  hasUrl: hasValidUrl,
  hasAnonKey: hasValidAnonKey,
  isConfigured: hasSupabaseConfig,
  message: missingConfigMessage,
};
