
/**
 * Preflight environment variable check
 * Shows a friendly warning in dev if optional env vars are missing
 * Never blocks the app in production
 */

export interface EnvCheckResult {
  isValid: boolean;
  missingVars: string[];
}

/**
 * Check if optional environment variables are present
 * Returns validation result with missing variables
 * 
 * Note: This function no longer checks backendUrl as the app
 * uses Supabase Edge Functions exclusively
 */
export function checkRequiredEnvVars(): EnvCheckResult {
  const missingVars: string[] = [];
  
  // No longer checking backendUrl - removed per requirements
  // App uses Supabase Edge Functions exclusively
  
  return {
    isValid: true, // Always valid - we don't block the app
    missingVars,
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
