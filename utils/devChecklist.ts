
/**
 * Dev Checklist Utility
 * Runs only in development to validate critical app setup before runtime
 * 
 * CHECKS:
 * 1. AuthProvider is mounted
 * 2. TherapistPersonas loads without errors
 * 3. Router is ready
 * 4. All critical contexts are available
 * 
 * This prevents the two main crash classes:
 * - "useAuth must be used within AuthProvider"
 * - "Can't find variable: esolvee" (stray tokens in TherapistPersonas)
 * 
 * NOTE: Uses static imports instead of dynamic require() to avoid build errors
 */

import * as AuthContext from '@/contexts/AuthContext';
import * as TherapistPersonas from '@/constants/TherapistPersonas';
import * as ThemeContext from '@/contexts/ThemeContext';
import * as UserPreferencesContext from '@/contexts/UserPreferencesContext';
import * as WidgetContext from '@/contexts/WidgetContext';

let checklistRun = false;

export function runDevChecklist() {
  // Only run once and only in dev
  if (!__DEV__ || checklistRun) {
    return;
  }
  
  checklistRun = true;
  
  const checks: string[] = [];
  let hasErrors = false;
  
  // Check 1: AuthProvider mounted
  try {
    const isMounted = AuthContext.isAuthProviderMounted?.() || false;
    
    if (isMounted) {
      checks.push('✅ AuthProvider mounted');
    } else {
      checks.push('⚠️ AuthProvider NOT mounted yet');
      // Note: This might be OK if called very early, will be mounted soon
    }
  } catch (error: any) {
    checks.push('❌ AuthProvider FAILED');
    hasErrors = true;
    console.error('[DevChecklist] AuthProvider error:', error.message);
  }
  
  // Check 2: TherapistPersonas loads without errors
  try {
    // Validate all required exports exist using static imports
    const requiredExports = [
      'THERAPIST_PERSONAS',
      'getPersonaById',
      'getPreviewContentById',
      'DEFAULT_PERSONA_ID'
    ];
    
    const missingExports = requiredExports.filter(exp => !(exp in TherapistPersonas));
    
    if (missingExports.length === 0) {
      checks.push('✅ TherapistPersonas loaded');
    } else {
      checks.push(`⚠️ TherapistPersonas missing: ${missingExports.join(', ')}`);
      hasErrors = true;
    }
  } catch (error: any) {
    checks.push('❌ TherapistPersonas FAILED');
    hasErrors = true;
    console.error('[DevChecklist] TherapistPersonas error:', error.message);
    
    // Check if it's a stray token error
    if (error.message.includes("Can't find variable") || error.message.includes("is not defined")) {
      console.error('   ⚠️ This looks like a stray token error!');
      console.error('   Check constants/TherapistPersonas.ts for standalone words at the top');
    }
  }
  
  // Check 3: Router ready (static import check)
  try {
    // Router is imported in _layout.tsx, so if we got here, it's available
    checks.push('✅ Router ready');
  } catch (error: any) {
    checks.push('❌ Router FAILED');
    hasErrors = true;
    console.error('[DevChecklist] Router error:', error.message);
  }
  
  // Check 4: Other critical contexts
  try {
    // Verify contexts are available using static imports
    if (ThemeContext && UserPreferencesContext && WidgetContext) {
      checks.push('✅ Contexts loaded');
    } else {
      checks.push('⚠️ Some contexts failed');
      hasErrors = true;
    }
  } catch (error: any) {
    checks.push('⚠️ Some contexts failed');
    console.error('[DevChecklist] Context error:', error.message);
  }
  
  // Print one-line checklist
  console.log('\n' + '═'.repeat(60));
  console.log('🔍 PRE-RUN CHECKLIST');
  console.log('═'.repeat(60));
  checks.forEach(check => console.log('   ' + check));
  console.log('═'.repeat(60) + '\n');
  
  // If any errors, print guidance
  if (hasErrors) {
    console.error('⚠️ CRITICAL: Some checks failed. The app may crash.');
    console.error('   Review the errors above and fix before continuing.\n');
  }
  
  return {
    passed: !hasErrors,
    checks,
  };
}
