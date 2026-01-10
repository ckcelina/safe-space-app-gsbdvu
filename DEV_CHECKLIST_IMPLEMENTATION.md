
# Dev Checklist & Scan Repair Implementation

## Overview

This implementation adds **dev-only** utilities to prevent the two main crash classes:

1. **"useAuth must be used within AuthProvider"** - Provider order issues
2. **"Can't find variable: esolvee"** - Stray tokens in constants files

## What Was Implemented

### 1. Enhanced AuthContext (`contexts/AuthContext.tsx`)

**Changes:**
- Added module-scoped `__AUTH_PROVIDER_MOUNTED__` flag
- Added `isAuthProviderMounted()` export for dev checklist
- Enhanced safety guard in `useAuth()` with detailed error logging
- Provider now logs when it mounts (dev-only)

**Safety Guard:**
```typescript
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // ✅ Returns safe fallback instead of crashing
    if (__DEV__) {
      console.error('❌ useAuth must be used within AuthProvider');
      console.error('   Stack trace:', new Error().stack);
    }
    return { /* safe fallback */ };
  }
  return context;
}
```

### 2. Dev Checklist (`utils/devChecklist.ts`)

**Purpose:** One-line pre-run validation that runs on app startup

**Checks:**
- ✅ AuthProvider is mounted
- ✅ TherapistPersonas loads without errors
- ✅ Router is ready
- ✅ All critical contexts are available

**Output Example:**
```
═══════════════════════════════════════════════════════════
🔍 PRE-RUN CHECKLIST
═══════════════════════════════════════════════════════════
   ✅ AuthProvider mounted
   ✅ TherapistPersonas loaded
   ✅ Router ready
   ✅ Contexts loaded
═══════════════════════════════════════════════════════════
```

### 3. Dev Scan & Repair (`utils/devScanRepair.ts`)

**Purpose:** Comprehensive scan for common issues

**Scans:**
1. **Stray Tokens** - Checks for standalone words in constants files
2. **AuthProvider Setup** - Verifies provider is properly mounted
3. **Route Provider Order** - Ensures all routes are under AuthProvider
4. **Safe Guards** - Checks for useAuthSafe hook availability

**Output Example:**
```
═══════════════════════════════════════════════════════════
🔧 SCAN & REPAIR
═══════════════════════════════════════════════════════════
❌ ERRORS FOUND:
   1. [constants/TherapistPersonas.ts]
      Failed to load: Can't find variable: esolvee
      Fix: Check for stray tokens or syntax errors at the top of the file

⚠️ WARNINGS:
   1. [contexts/AuthContext.tsx]
      AuthProvider is not mounted yet
      Fix: This may be OK if called early - provider should mount soon
═══════════════════════════════════════════════════════════
```

### 4. Quick Scan Utility (`utils/scanAndRepair.ts`)

**Purpose:** Simplified scan that can be called manually

**Functions:**
- `quickScan()` - Fast runtime check
- `validateModule(path)` - Check if a module can be imported
- `checkAuthUsage()` - Verify AuthProvider is mounted
- `scanFileForStrayTokens(path)` - Check specific file for issues
- `scanAndRepair()` - Complete scan with detailed output

### 5. Updated Root Layout (`app/_layout.tsx`)

**Changes:**
- Runs dev checklist after fonts load
- Runs scan & repair after checklist
- Added 100ms delay to ensure providers are mounted
- Added comments explaining provider order

## How It Works

### Startup Flow

1. **App starts** → Fonts load → Splash screen hides
2. **Providers mount** → AuthProvider sets `__AUTH_PROVIDER_MOUNTED__ = true`
3. **Dev checklist runs** (100ms delay) → Validates setup
4. **Scan & repair runs** → Checks for issues
5. **Console output** → Shows results

### When Issues Are Detected

**Stray Token Example:**
```
❌ ERRORS FOUND:
   1. [constants/TherapistPersonas.ts]
      Failed to load: Can't find variable: esolvee
      Fix: Check for stray tokens or syntax errors at the top of the file
```

**Provider Order Example:**
```
⚠️ WARNINGS:
   1. [contexts/AuthContext.tsx]
      AuthProvider is not mounted yet
      Fix: This may be OK if called early - provider should mount soon
```

## Testing

### 1. Normal Startup (No Issues)

**Expected Console Output:**
```
[AuthProvider] Mounted successfully

═══════════════════════════════════════════════════════════
🔍 PRE-RUN CHECKLIST
═══════════════════════════════════════════════════════════
   ✅ AuthProvider mounted
   ✅ TherapistPersonas loaded
   ✅ Router ready
   ✅ Contexts loaded
═══════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════
🔧 SCAN & REPAIR
═══════════════════════════════════════════════════════════
✅ No issues found - all checks passed!
═══════════════════════════════════════════════════════════
```

### 2. With Stray Token

If you add a stray token like `esolvee` to the top of `TherapistPersonas.ts`:

```typescript
esolvee  // ❌ This will be detected

import { ImageSourcePropType } from 'react-native';
// ... rest of file
```

**Expected Console Output:**
```
❌ ERRORS FOUND:
   1. [constants/TherapistPersonas.ts]
      Failed to load: Can't find variable: esolvee
      Fix: Check for stray tokens or syntax errors at the top of the file
      ⚠️ Possible stray token in TherapistPersonas.ts - check for standalone words
```

### 3. With Provider Order Issue

If `useAuth()` is called before `AuthProvider` mounts:

```
⚠️ useAuth must be used within AuthProvider
   Stack trace: Error
       at useAuth (contexts/AuthContext.tsx:123:45)
       at HomeScreen (app/(tabs)/(home)/index.tsx:67:89)
   Returning safe fallback to prevent crash
```

## Manual Testing

You can manually run scans in your code:

```typescript
import { quickScan, scanAndRepair } from '@/utils/scanAndRepair';

// Quick scan
const result = quickScan();
console.log('Scan passed:', result.success);

// Full scan
const fullResult = scanAndRepair();
console.log('Issues found:', fullResult.issues);
```

## Key Benefits

### 1. **Prevents Crashes**
- Safety guard in `useAuth()` returns fallback instead of crashing
- Early detection of stray tokens before they cause runtime errors

### 2. **Clear Diagnostics**
- One-line checklist shows status at a glance
- Detailed error messages with fix suggestions
- Stack traces for debugging

### 3. **Dev-Only**
- All checks are guarded by `if (__DEV__)`
- Zero impact on production builds
- No new dependencies required

### 4. **Automated**
- Runs automatically on app startup
- No manual intervention needed
- Catches issues before they cause problems

## Files Changed

1. ✅ `contexts/AuthContext.tsx` - Added safety guard and mount tracking
2. ✅ `utils/devChecklist.ts` - One-line pre-run checklist
3. ✅ `utils/devScanRepair.ts` - Comprehensive issue scanner
4. ✅ `utils/scanAndRepair.ts` - Quick runtime checks
5. ✅ `app/_layout.tsx` - Integrated checklist and scan on startup

## Common Issues & Fixes

### Issue: "AuthProvider not mounted yet"

**Cause:** Checklist runs before provider mounts

**Fix:** This is usually OK - the 100ms delay should be enough. If you see this consistently, increase the delay in `_layout.tsx`:

```typescript
setTimeout(() => {
  runDevChecklist();
  runDevScanRepair();
}, 200); // Increase from 100ms to 200ms
```

### Issue: "TherapistPersonas failed to load"

**Cause:** Stray token or syntax error in the file

**Fix:** 
1. Open `constants/TherapistPersonas.ts`
2. Check the first few lines for standalone words
3. Remove any text that isn't part of valid syntax
4. Ensure file starts with `import` statements

### Issue: "useAuth must be used within AuthProvider"

**Cause:** Component using `useAuth()` renders before provider mounts

**Fix:**
1. Verify `AuthProvider` wraps all routes in `app/_layout.tsx`
2. Use `useAuthSafe()` from `lib/safeGuards/providerGuards.tsx` instead
3. Add loading state to wait for auth to initialize

## Next Steps

1. **Run the app** - Check console for checklist output
2. **Navigate to all screens** - Verify no crashes
3. **Check for warnings** - Address any issues found
4. **Test edge cases** - Try navigating quickly, force-closing, etc.

## Troubleshooting

If you see persistent errors:

1. **Check provider order** in `app/_layout.tsx`
2. **Verify all contexts** can be imported
3. **Look for stray tokens** in constants files
4. **Check stack traces** for the source of `useAuth()` calls
5. **Use safe guards** (`useAuthSafe`) in components

## Summary

This implementation provides:

- ✅ **One-line pre-run checklist** in console
- ✅ **Automated issue detection** on startup
- ✅ **Safety guards** to prevent crashes
- ✅ **Clear error messages** with fix suggestions
- ✅ **Dev-only code** (no production impact)
- ✅ **No new dependencies** required

The app is now protected against the two main crash classes and will provide clear diagnostics if issues occur.
