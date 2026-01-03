
/**
 * Configuration Verification Utility
 * 
 * Helps verify that all required configuration is present
 * and provides helpful debugging information.
 */

import Constants from 'expo-constants';
import { isSupabaseConfigured, getBackendUrl, isBackendConfigured } from '@/lib/supabase';

export interface ConfigStatus {
  supabase: {
    configured: boolean;
    url: string | null;
    hasAnonKey: boolean;
    source: 'env' | 'expo.extra' | 'manifest.extra' | 'none';
  };
  backend: {
    configured: boolean;
    url: string | null;
    source: 'env' | 'expo.extra' | 'manifest.extra' | 'none';
  };
}

/**
 * Get detailed configuration status for debugging
 */
export function getConfigStatus(): ConfigStatus {
  // Check Supabase configuration
  const envSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const envSupabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const extraSupabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
  const extraSupabaseKey = Constants.expoConfig?.extra?.supabaseAnonKey;
  const manifestSupabaseUrl = Constants.manifest?.extra?.supabaseUrl;
  const manifestSupabaseKey = Constants.manifest?.extra?.supabaseAnonKey;

  let supabaseSource: 'env' | 'expo.extra' | 'manifest.extra' | 'none' = 'none';
  let supabaseUrl: string | null = null;
  let hasAnonKey = false;

  if (envSupabaseUrl && envSupabaseKey) {
    supabaseSource = 'env';
    supabaseUrl = envSupabaseUrl;
    hasAnonKey = true;
  } else if (extraSupabaseUrl && extraSupabaseKey) {
    supabaseSource = 'expo.extra';
    supabaseUrl = extraSupabaseUrl;
    hasAnonKey = true;
  } else if (manifestSupabaseUrl && manifestSupabaseKey) {
    supabaseSource = 'manifest.extra';
    supabaseUrl = manifestSupabaseUrl;
    hasAnonKey = true;
  }

  // Check backend configuration
  const envBackendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  const extraBackendUrl = Constants.expoConfig?.extra?.backendUrl;
  const manifestBackendUrl = Constants.manifest?.extra?.backendUrl;

  let backendSource: 'env' | 'expo.extra' | 'manifest.extra' | 'none' = 'none';
  let backendUrl: string | null = null;

  if (envBackendUrl) {
    backendSource = 'env';
    backendUrl = envBackendUrl;
  } else if (extraBackendUrl) {
    backendSource = 'expo.extra';
    backendUrl = extraBackendUrl;
  } else if (manifestBackendUrl) {
    backendSource = 'manifest.extra';
    backendUrl = manifestBackendUrl;
  }

  return {
    supabase: {
      configured: isSupabaseConfigured(),
      url: supabaseUrl,
      hasAnonKey,
      source: supabaseSource,
    },
    backend: {
      configured: isBackendConfigured(),
      url: backendUrl,
      source: backendSource,
    },
  };
}

/**
 * Log configuration status to console (dev only)
 */
export function logConfigStatus(): void {
  if (!__DEV__) return;

  const status = getConfigStatus();
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Configuration Status');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('\n🔐 Supabase:');
  console.log(`  ✓ Configured: ${status.supabase.configured ? '✅' : '❌'}`);
  console.log(`  ✓ URL: ${status.supabase.url || 'Not set'}`);
  console.log(`  ✓ Has Anon Key: ${status.supabase.hasAnonKey ? '✅' : '❌'}`);
  console.log(`  ✓ Source: ${status.supabase.source}`);
  
  console.log('\n🌐 Backend:');
  console.log(`  ✓ Configured: ${status.backend.configured ? '✅' : '❌ (Optional)'}`);
  console.log(`  ✓ URL: ${status.backend.url || 'Not set (Optional)'}`);
  console.log(`  ✓ Source: ${status.backend.source}`);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Get user-friendly configuration instructions
 */
export function getConfigInstructions(): string {
  const status = getConfigStatus();
  
  if (status.supabase.configured) {
    return '✅ Configuration is complete! Your app is ready to use.';
  }
  
  return `
⚠️ Configuration Required

Please add the following to your .env file:

EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

Then restart the Expo dev server.

Optional: If you need a custom backend, also add:
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com
  `.trim();
}
