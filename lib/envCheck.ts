
/**
 * Preflight environment variable check
 * Shows a friendly error screen in dev if required env vars are missing
 */

import Constants from 'expo-constants';

export interface EnvCheckResult {
  isValid: boolean;
  missingVars: string[];
  backendUrl?: string;
}

/**
 * Check if required environment variables are present
 * Returns validation result with missing variables
 */
export function checkRequiredEnvVars(): EnvCheckResult {
  const missingVars: string[] = [];
  
  // Check for backend URL (configured in app.json under expo.extra.backendUrl)
  const backendUrl = Constants.expoConfig?.extra?.backendUrl;
  
  if (!backendUrl || backendUrl.trim() === '') {
    missingVars.push('backendUrl (in app.json under expo.extra.backendUrl)');
  }

  return {
    isValid: missingVars.length === 0,
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

  return `Missing required configuration:\n\n${result.missingVars.map(v => `• ${v}`).join('\n')}\n\nPlease configure these in app.json under "extra".`;
}
