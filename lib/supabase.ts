
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables with validation
// Read values from process.env
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const missingConfigMessage =
  'Missing Supabase configuration. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.';

const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey);

let hasLoggedMissingConfigWarning = false;

const resolveMissingConfig = async () => {
  const error = new Error(missingConfigMessage);
  if (__DEV__ && !hasLoggedMissingConfigWarning) {
    console.warn('[Supabase] Configuration missing - operations will fail gracefully');
    hasLoggedMissingConfigWarning = true;
  }

  return { data: null, error };
};

const createQueryBuilderStub = () => {
  const handler: ProxyHandler<any> = {
    apply: () => resolveMissingConfig(),
    get: () => builder,
  };

  const builder = new Proxy(resolveMissingConfig as any, handler);
  return builder;
};

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

// Log configuration status only in dev mode
if (__DEV__) {
  if (hasSupabaseConfig) {
    console.log('[Supabase] Client initialized successfully');
  } else {
    console.warn('[Supabase] ⚠️  Missing environment variables!');
    console.warn('[Supabase] URL:', supabaseUrl ? 'Present' : 'MISSING');
    console.warn('[Supabase] Key:', supabaseAnonKey ? 'Present' : 'MISSING');
    console.warn('[Supabase] App will show configuration error screen');
  }
}

// Create and export a single Supabase client instance
export const supabase = supabaseClient;

// Export a function to check if client is ready
export const isSupabaseReady = () => hasSupabaseConfig;

export const supabaseConfigStatus = {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  message: missingConfigMessage,
};
