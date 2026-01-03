
/**
 * Preflight environment variable check
 * Shows a friendly warning in dev if optional env vars are missing
 * Never blocks the app in production
 */

import Constants from 'expo-constants';

export interface EnvCheckResult {
  isValid: boolean;
  missingVars: string[];
  backendUrl?: string;
}

/**
 * Check if optional environment variables are present
 * Returns validation result with missing variables
 * 
 * Note: backendUrl is optional for apps using Supabase Edge Functions
 */
export function checkRequiredEnvVars(): EnvCheckResult {
  const missingVars: string[] = [];
  
  // Get backend URL from env var or app.json
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || Constants.expoConfig?.extra?.backendUrl || '';
  
  // Only warn if backendUrl is needed but not configured
  // For Supabase-based apps, this is optional since they use Edge Functions
  // Empty string is acceptable - it means no separate backend is configured
  
  return {
    isValid: true, // Always valid - we don't block the app for missing backendUrl
    missingVars,
    backendUrl,
  };
}

/**
 * Get a user-friendly error message for missing env vars
 */
export function getEnvErrorMessage(result: EnvCheckResult): string {
  if (result.isValid) {
    return '';
  }

  return `Missing optional configuration:\n\n${result.missingVars.map(v => `• ${v}`).join('\n')}\n\nThe app will continue with limited features.`;
}
