
/**
 * Developer-friendly diagnostics for Expo startup issues
 * Only runs in development mode
 */

// Check if we're in development
const isDev = __DEV__;

/**
 * Check environment variables and log diagnostics
 * This runs in useEffect to avoid blocking initial render
 */
export function runDevDiagnostics() {
  if (!isDev) return;

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 DEV DIAGNOSTICS START');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Log app boot
    console.log('✅ Dev start: app booted');
    
    // Check Supabase environment variables
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log(`📍 Supabase URL present: ${!!supabaseUrl}`);
    console.log(`🔑 Supabase Anon Key present: ${!!supabaseAnonKey}`);
    
    // Check for missing variables
    const missingVars: string[] = [];
    if (!supabaseUrl) missingVars.push('EXPO_PUBLIC_SUPABASE_URL');
    if (!supabaseAnonKey) missingVars.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
    
    if (missingVars.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ MISSING ENVIRONMENT VARIABLES');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('The following environment variables are missing:');
      missingVars.forEach(varName => {
        console.log(`  • ${varName}`);
      });
      console.log('');
      console.log('To fix this:');
      console.log('1. Create a .env file in your project root');
      console.log('2. Add the missing variables:');
      missingVars.forEach(varName => {
        console.log(`   ${varName}=your_value_here`);
      });
      console.log('3. Restart the Metro bundler (stop and run "npm run dev" again)');
      console.log('');
      console.log('Note: The app may use hardcoded values as fallback.');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('✅ All required environment variables are present');
    }
    
    // Log Metro bundler status (without making network requests)
      if (typeof global !== 'undefined' && (global as any).__DEV__) {
      console.log('✅ Metro bundler: Connected (JS bundle loaded successfully)');
      console.log('📦 Running in development mode with hot reload enabled');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 DEV DIAGNOSTICS END');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.log('[Dev Diagnostics] Error running diagnostics:', error);
  }
}

/**
 * Log a startup error in a developer-friendly format
 */
export function logStartupError(context: string, error: any) {
  if (!isDev) return;

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`❌ STARTUP ERROR: ${context}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Error:', error?.message || error);
    if (error?.stack) {
      console.log('Stack:', error.stack);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (logError) {
    console.log('[Dev Diagnostics] Error logging startup error:', logError);
  }
}
