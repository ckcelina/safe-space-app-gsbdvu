
/**
 * Supabase Client Configuration
 * Robust multi-source initialization with validation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

type ConfigSource = 'env' | 'expo.extra' | 'manifest.extra' | 'none';

export interface SupabaseConfig {
  url?: string;
  anonKey?: string;
  isValid: boolean;
  problems: string[];
  source: ConfigSource;
}

const readSupabaseConfig = (): { url?: string; anonKey?: string; source: ConfigSource } => {
  const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const envKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (envUrl || envKey) {
    return { url: envUrl, anonKey: envKey, source: 'env' };
  }

  const expoExtra = Constants.expoConfig?.extra;
  const extraUrl = expoExtra?.supabaseUrl || expoExtra?.EXPO_PUBLIC_SUPABASE_URL;
  const extraKey = expoExtra?.supabaseAnonKey || expoExtra?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (extraUrl || extraKey) {
    return { url: extraUrl, anonKey: extraKey, source: 'expo.extra' };
  }

  const manifestExtra = Constants.manifest?.extra;
  const manifestUrl = manifestExtra?.supabaseUrl || manifestExtra?.EXPO_PUBLIC_SUPABASE_URL;
  const manifestKey = manifestExtra?.supabaseAnonKey || manifestExtra?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (manifestUrl || manifestKey) {
    return { url: manifestUrl, anonKey: manifestKey, source: 'manifest.extra' };
  }

  return { source: 'none' };
};

const validateSupabaseConfig = (config: { url?: string; anonKey?: string; source: ConfigSource }): SupabaseConfig => {
  const problems: string[] = [];

  if (!config.url) {
    problems.push('Missing Supabase URL (EXPO_PUBLIC_SUPABASE_URL)');
  } else if (!config.url.startsWith('https://')) {
    problems.push('Supabase URL must start with https://');
  } else if (!config.url.includes('supabase.co')) {
    problems.push('Supabase URL must contain supabase.co');
  }

  if (!config.anonKey || !config.anonKey.trim()) {
    problems.push('Missing Supabase anon key (EXPO_PUBLIC_SUPABASE_ANON_KEY)');
  }

  return {
    url: config.url,
    anonKey: config.anonKey,
    isValid: problems.length === 0,
    problems,
    source: config.source,
  };
};

const supabaseConfig = validateSupabaseConfig(readSupabaseConfig());
const supabaseReady = supabaseConfig.isValid;
const supabaseConfigError = supabaseConfig.problems[0];

if (__DEV__) {
  if (supabaseReady) {
    const host = supabaseConfig.url ? new URL(supabaseConfig.url).hostname : 'unknown';
    const keySuffix = supabaseConfig.anonKey ? supabaseConfig.anonKey.slice(-6) : 'missing';
    console.log('[Supabase] ✅ Configuration validated');
    console.log(`[Supabase] 🌐 urlHost=${host}`);
    console.log(`[Supabase] 🔑 anon=…${keySuffix}`);
    console.log(`[Supabase] source=${supabaseConfig.source}`);
  } else {
    console.warn('[Supabase] Missing or invalid configuration');
    supabaseConfig.problems.forEach((problem) => {
      console.warn(`[Supabase] ${problem}`);
    });
  }
}

const supabaseUrl = supabaseConfig.url || '';
const supabaseAnonKey = supabaseConfig.anonKey || '';

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

const getBackendUrlInternal = (): { url?: string; source: ConfigSource } => {
  const envBackend = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envBackend) {
    return { url: envBackend, source: 'env' };
  }

  const expoExtra = Constants.expoConfig?.extra;
  const extraBackend = expoExtra?.backendUrl || expoExtra?.EXPO_PUBLIC_BACKEND_URL;
  if (extraBackend) {
    return { url: extraBackend, source: 'expo.extra' };
  }

  const manifestExtra = Constants.manifest?.extra;
  const manifestBackend = manifestExtra?.backendUrl || manifestExtra?.EXPO_PUBLIC_BACKEND_URL;
  if (manifestBackend) {
    return { url: manifestBackend, source: 'manifest.extra' };
  }

  return { source: 'none' };
};

export function getSupabaseConfig(): SupabaseConfig {
  return supabaseConfig;
}

export function isSupabaseReady(): boolean {
  return supabaseReady;
}

export function isSupabaseConfigured(): boolean {
  return supabaseReady;
}

export function getSupabaseConfigError(): string | undefined {
  return supabaseConfigError;
}

export function getBackendUrl(): string {
  return getBackendUrlInternal().url || '';
}

export function isBackendConfigured(): boolean {
  return Boolean(getBackendUrlInternal().url);
}

export { supabase, supabaseReady, supabaseConfigError };
