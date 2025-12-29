
import { getSupabaseConfig, supabaseReady, supabaseConfigError } from '@/lib/supabase';

/**
 * Utility functions for checking Supabase configuration status
 */

/**
 * Check if Supabase is properly configured and ready to use
 */
export function checkSupabaseReady(): boolean {
  return supabaseReady;
}

/**
 * Get detailed configuration information
 */
export function getConfigDetails() {
  const config = getSupabaseConfig();
  return {
    isReady: supabaseReady,
    error: supabaseConfigError,
    url: config.url,
    hasKey: config.hasKey,
    isValid: config.isValid,
    platform: config.platform,
  };
}

/**
 * Log configuration status to console (DEV only)
 */
export function logConfigStatus() {
  if (!__DEV__) return;

  const details = getConfigDetails();
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[Config Check] Supabase Configuration Status');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Ready: ${details.isReady ? '✅' : '❌'}`);
  console.log(`URL Present: ${details.url ? '✅' : '❌'}`);
  console.log(`Key Present: ${details.hasKey ? '✅' : '❌'}`);
  console.log(`Valid: ${details.isValid ? '✅' : '❌'}`);
  console.log(`Platform: ${details.platform}`);
  
  if (details.error) {
    console.log(`Error: ${details.error}`);
  }
  
  if (details.url) {
    try {
      const hostname = new URL(details.url).hostname;
      console.log(`URL Host: ${hostname}`);
      
      // Check if it matches expected project
      const expectedHost = 'zjzvkxvahrbuuyzjzxol.supabase.co';
      if (hostname === expectedHost) {
        console.log('✅ URL matches expected Safe Space project');
      } else {
        console.log(`⚠️  URL does not match expected project (${expectedHost})`);
      }
    } catch (e) {
      console.log(`URL: ${details.url} (invalid format)`);
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * Assert that Supabase is ready, throw error if not (for critical operations)
 */
export function assertSupabaseReady() {
  if (!supabaseReady) {
    const error = supabaseConfigError || 'Supabase is not properly configured';
    throw new Error(`[Supabase] ${error}`);
  }
}

/**
 * Get expected project configuration for Safe Space
 */
export function getExpectedConfig() {
  return {
    projectName: 'Safe Space',
    projectId: 'zjzvkxvahrbuuyzjzxol',
    expectedUrl: 'https://zjzvkxvahrbuuyzjzxol.supabase.co',
  };
}

/**
 * Verify that the current configuration matches the expected Safe Space project
 */
export function verifyProjectMatch(): { matches: boolean; message: string } {
  const config = getSupabaseConfig();
  const expected = getExpectedConfig();
  
  if (!config.url) {
    return {
      matches: false,
      message: 'No Supabase URL configured',
    };
  }
  
  if (config.url === expected.expectedUrl) {
    return {
      matches: true,
      message: 'Configuration matches Safe Space project',
    };
  }
  
  return {
    matches: false,
    message: `URL does not match expected Safe Space project. Expected: ${expected.expectedUrl}, Got: ${config.url}`,
  };
}
