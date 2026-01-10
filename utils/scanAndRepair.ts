
/**
 * Scan & Repair Utility
 * 
 * Quick runtime checks for common issues:
 * - Stray tokens in constants
 * - Hooks used outside providers
 * - Provider order issues
 * 
 * This is a simplified version that can be called manually
 */

interface ScanResult {
  success: boolean;
  issues: string[];
}

/**
 * Quick scan for common issues
 * Returns a summary of any problems found
 */
export function quickScan(): ScanResult {
  if (!__DEV__) {
    return { success: true, issues: [] };
  }

  console.log('\n🔍 Running quick scan...\n');

  const issues: string[] = [];

  // Check 1: AuthProvider availability
  try {
    const AuthContext = require('@/contexts/AuthContext');
    const isMounted = AuthContext.isAuthProviderMounted?.() || false;
    
    if (!isMounted) {
      issues.push('AuthProvider not mounted yet (may be OK if called early)');
    }
  } catch (error: any) {
    issues.push(`AuthContext failed to load: ${error.message}`);
  }

  // Check 2: TherapistPersonas
  try {
    const TherapistPersonas = require('@/constants/TherapistPersonas');
    
    if (!TherapistPersonas.THERAPIST_PERSONAS) {
      issues.push('TherapistPersonas.THERAPIST_PERSONAS is missing');
    }
    if (!TherapistPersonas.DEFAULT_PERSONA_ID) {
      issues.push('TherapistPersonas.DEFAULT_PERSONA_ID is missing');
    }
  } catch (error: any) {
    issues.push(`TherapistPersonas failed to load: ${error.message}`);
    
    // Check if it's a stray token error
    if (error.message.includes("Can't find variable") || error.message.includes("is not defined")) {
      issues.push('⚠️ Possible stray token in TherapistPersonas.ts - check for standalone words');
    }
  }

  // Check 3: Required contexts
  const requiredContexts = [
    '@/contexts/ThemeContext',
    '@/contexts/UserPreferencesContext',
    '@/contexts/WidgetContext',
  ];

  requiredContexts.forEach(ctx => {
    try {
      require(ctx);
    } catch (error: any) {
      issues.push(`Failed to load ${ctx}: ${error.message}`);
    }
  });

  // Check 4: Router availability
  try {
    require('expo-router');
  } catch (error: any) {
    issues.push(`expo-router not available: ${error.message}`);
  }

  // Check 5: Safe guards
  try {
    const SafeGuards = require('@/lib/safeGuards/providerGuards');
    if (!SafeGuards.useAuthSafe) {
      issues.push('useAuthSafe hook is missing');
    }
  } catch (error: any) {
    issues.push(`Safe guards not available: ${error.message}`);
  }

  // Report results
  if (issues.length === 0) {
    console.log('✅ Quick scan passed - no issues found\n');
  } else {
    console.log('⚠️ Issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
    console.log('');
  }

  return {
    success: issues.length === 0,
    issues,
  };
}

/**
 * Validate that a specific module can be imported
 * Used to check for stray tokens or syntax errors
 */
export function validateModule(modulePath: string): { success: boolean; error?: string } {
  try {
    require(modulePath);
    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Unknown error' 
    };
  }
}

/**
 * Check if useAuth is being called with proper safety guards
 */
export function checkAuthUsage(): boolean {
  if (!__DEV__) {
    return true;
  }
  
  try {
    const AuthContext = require('@/contexts/AuthContext');
    const isMounted = AuthContext.isAuthProviderMounted?.() || false;
    
    if (!isMounted) {
      console.warn('⚠️ useAuth may be called before AuthProvider is mounted');
      return false;
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Could not check auth usage:', error.message);
    return false;
  }
}

/**
 * Scan for stray tokens in a specific file
 * This is a runtime check that tries to import the file
 */
export function scanFileForStrayTokens(filePath: string): ScanResult {
  if (!__DEV__) {
    return { success: true, issues: [] };
  }
  
  const issues: string[] = [];
  
  try {
    require(filePath);
  } catch (error: any) {
    issues.push(`Failed to load ${filePath}: ${error.message}`);
    
    // Check for common stray token patterns
    if (error.message.includes("Can't find variable")) {
      const match = error.message.match(/Can't find variable: (\w+)/);
      if (match) {
        issues.push(`⚠️ Stray token detected: "${match[1]}"`);
        issues.push(`   Check ${filePath} for standalone words at the top of the file`);
      }
    }
  }
  
  return {
    success: issues.length === 0,
    issues,
  };
}

/**
 * Run a complete scan and repair
 * This is the main entry point for manual scans
 */
export function scanAndRepair(): ScanResult {
  if (!__DEV__) {
    return { success: true, issues: [] };
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('🔧 SCAN & REPAIR - TARGETED SCAN');
  console.log('═'.repeat(60) + '\n');
  
  const allIssues: string[] = [];
  
  // Scan critical files
  const filesToScan = [
    '@/constants/TherapistPersonas',
    '@/constants/AITones',
    '@/contexts/AuthContext',
    '@/contexts/ThemeContext',
    '@/contexts/UserPreferencesContext',
  ];
  
  filesToScan.forEach(file => {
    const result = scanFileForStrayTokens(file);
    if (!result.success) {
      allIssues.push(...result.issues);
    }
  });
  
  // Check provider order
  const authCheck = checkAuthUsage();
  if (!authCheck) {
    allIssues.push('AuthProvider may not be properly mounted');
  }
  
  // Print results
  if (allIssues.length === 0) {
    console.log('✅ All checks passed - no issues found\n');
  } else {
    console.log('❌ Issues found:');
    allIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
    console.log('');
  }
  
  console.log('═'.repeat(60) + '\n');
  
  return {
    success: allIssues.length === 0,
    issues: allIssues,
  };
}
