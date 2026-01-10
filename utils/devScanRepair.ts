
/**
 * Dev Scan & Repair Utility
 * 
 * Targeted scan to prevent recurrence of:
 * - Stray tokens like 'esolvee' in constants files
 * - Hooks used outside providers
 * - Provider order issues
 * 
 * This runs automatically in development mode after the checklist
 */

interface ScanIssue {
  file: string;
  issue: string;
  severity: 'error' | 'warning';
  fix?: string;
}

/**
 * Scan for stray tokens in critical files
 * Stray tokens are standalone words that aren't part of valid syntax
 */
function scanForStrayTokens(): ScanIssue[] {
  const issues: ScanIssue[] = [];
  
  // Check TherapistPersonas
  try {
    const TherapistPersonas = require('@/constants/TherapistPersonas');
    
    // Validate structure
    if (!TherapistPersonas.THERAPIST_PERSONAS) {
      issues.push({
        file: 'constants/TherapistPersonas.ts',
        issue: 'THERAPIST_PERSONAS export is missing',
        severity: 'error',
        fix: 'Ensure THERAPIST_PERSONAS is exported',
      });
    }
    
    if (!TherapistPersonas.DEFAULT_PERSONA_ID) {
      issues.push({
        file: 'constants/TherapistPersonas.ts',
        issue: 'DEFAULT_PERSONA_ID export is missing',
        severity: 'error',
        fix: 'Ensure DEFAULT_PERSONA_ID is exported',
      });
    }
  } catch (error: any) {
    issues.push({
      file: 'constants/TherapistPersonas.ts',
      issue: `Failed to load: ${error.message}`,
      severity: 'error',
      fix: 'Check for stray tokens or syntax errors at the top of the file',
    });
  }
  
  // Check other constants
  try {
    require('@/constants/AITones');
  } catch (error: any) {
    issues.push({
      file: 'constants/AITones.ts',
      issue: `Failed to load: ${error.message}`,
      severity: 'error',
      fix: 'Check for stray tokens or syntax errors',
    });
  }
  
  return issues;
}

/**
 * Verify AuthProvider is properly set up
 */
function verifyAuthProvider(): ScanIssue[] {
  const issues: ScanIssue[] = [];
  
  try {
    const AuthContext = require('@/contexts/AuthContext');
    
    // Check if provider has mount tracking
    if (!AuthContext.isAuthProviderMounted) {
      issues.push({
        file: 'contexts/AuthContext.tsx',
        issue: 'isAuthProviderMounted function is missing',
        severity: 'warning',
        fix: 'Add isAuthProviderMounted export to track provider mounting',
      });
    }
    
    // Check if useAuth has safety guard
    const isMounted = AuthContext.isAuthProviderMounted?.() || false;
    if (!isMounted) {
      issues.push({
        file: 'contexts/AuthContext.tsx',
        issue: 'AuthProvider is not mounted yet',
        severity: 'warning',
        fix: 'This may be OK if called early - provider should mount soon',
      });
    }
  } catch (error: any) {
    issues.push({
      file: 'contexts/AuthContext.tsx',
      issue: `Failed to load: ${error.message}`,
      severity: 'error',
      fix: 'Check for syntax errors in AuthContext',
    });
  }
  
  return issues;
}

/**
 * Verify all routes that use useAuth are under AuthProvider
 */
function verifyRouteProviderOrder(): ScanIssue[] {
  const issues: ScanIssue[] = [];
  
  // Check that _layout.tsx has proper provider order
  try {
    // This is a runtime check - we can't statically analyze the layout
    // But we can check if the provider is mounted
    const AuthContext = require('@/contexts/AuthContext');
    const isMounted = AuthContext.isAuthProviderMounted?.() || false;
    
    if (!isMounted) {
      issues.push({
        file: 'app/_layout.tsx',
        issue: 'AuthProvider may not be wrapping all routes',
        severity: 'warning',
        fix: 'Ensure AuthProvider wraps the entire Stack in _layout.tsx',
      });
    }
  } catch (error: any) {
    issues.push({
      file: 'app/_layout.tsx',
      issue: 'Could not verify provider order',
      severity: 'warning',
      fix: 'Manually verify AuthProvider wraps all routes',
    });
  }
  
  return issues;
}

/**
 * Check for safe guard hooks
 */
function verifySafeGuards(): ScanIssue[] {
  const issues: ScanIssue[] = [];
  
  try {
    const SafeGuards = require('@/lib/safeGuards/providerGuards');
    
    if (!SafeGuards.useAuthSafe) {
      issues.push({
        file: 'lib/safeGuards/providerGuards.tsx',
        issue: 'useAuthSafe hook is missing',
        severity: 'warning',
        fix: 'Add useAuthSafe hook for safe auth access',
      });
    }
  } catch (error: any) {
    issues.push({
      file: 'lib/safeGuards/providerGuards.tsx',
      issue: `Failed to load: ${error.message}`,
      severity: 'warning',
      fix: 'Create safe guard hooks to prevent crashes',
    });
  }
  
  return issues;
}

/**
 * Run complete scan and return results
 */
export function runDevScanRepair() {
  if (!__DEV__) {
    return { passed: true, issues: [] };
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('🔧 SCAN & REPAIR');
  console.log('═'.repeat(60));
  
  const allIssues: ScanIssue[] = [
    ...scanForStrayTokens(),
    ...verifyAuthProvider(),
    ...verifyRouteProviderOrder(),
    ...verifySafeGuards(),
  ];
  
  // Separate errors and warnings
  const errors = allIssues.filter(i => i.severity === 'error');
  const warnings = allIssues.filter(i => i.severity === 'warning');
  
  if (errors.length > 0) {
    console.error('❌ ERRORS FOUND:');
    errors.forEach((issue, index) => {
      console.error(`   ${index + 1}. [${issue.file}]`);
      console.error(`      ${issue.issue}`);
      if (issue.fix) {
        console.error(`      Fix: ${issue.fix}`);
      }
    });
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️ WARNINGS:');
    warnings.forEach((issue, index) => {
      console.warn(`   ${index + 1}. [${issue.file}]`);
      console.warn(`      ${issue.issue}`);
      if (issue.fix) {
        console.warn(`      Fix: ${issue.fix}`);
      }
    });
    console.log('');
  }
  
  if (allIssues.length === 0) {
    console.log('✅ No issues found - all checks passed!\n');
  }
  
  console.log('═'.repeat(60) + '\n');
  
  return {
    passed: errors.length === 0,
    issues: allIssues,
  };
}

/**
 * Summary of files checked and issues found
 */
export function printScanSummary() {
  if (!__DEV__) {
    return;
  }
  
  console.log('📋 SCAN SUMMARY:');
  console.log('   Files checked:');
  console.log('   - constants/TherapistPersonas.ts');
  console.log('   - constants/AITones.ts');
  console.log('   - contexts/AuthContext.tsx');
  console.log('   - lib/safeGuards/providerGuards.tsx');
  console.log('   - app/_layout.tsx (provider order)');
  console.log('');
}
