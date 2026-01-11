
# Dev Checklist Quick Reference

## Console Output on Startup

### ✅ Success (No Issues)
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

### ❌ Failure (Issues Found)
```
═══════════════════════════════════════════════════════════
🔍 PRE-RUN CHECKLIST
═══════════════════════════════════════════════════════════
   ✅ AuthProvider mounted
   ❌ TherapistPersonas FAILED
   ✅ Router ready
   ✅ Contexts loaded
═══════════════════════════════════════════════════════════
⚠️ CRITICAL: Some checks failed. The app may crash.

═══════════════════════════════════════════════════════════
🔧 SCAN & REPAIR
═══════════════════════════════════════════════════════════
❌ ERRORS FOUND:
   1. [constants/TherapistPersonas.ts]
      Failed to load: Can't find variable: esolvee
      Fix: Check for stray tokens or syntax errors at the top of the file
═══════════════════════════════════════════════════════════
```

## Quick Fixes

### Fix 1: Stray Token in TherapistPersonas.ts

**Error:**
```
Can't find variable: esolvee
```

**Fix:**
1. Open `constants/TherapistPersonas.ts`
2. Remove any standalone words at the top (like `esolvee`)
3. Ensure file starts with `import` statements

### Fix 2: useAuth Outside Provider

**Error:**
```
❌ useAuth must be used within AuthProvider
```

**Fix Option A - Use Safe Hook:**
```typescript
// ❌ Before
import { useAuth } from '@/contexts/AuthContext';

// ✅ After
import { useAuthSafe } from '@/lib/safeGuards/providerGuards';

function MyComponent() {
  const { user } = useAuthSafe(); // Won't crash if provider missing
  // ...
}
```

**Fix Option B - Check Provider Order:**
```typescript
// In app/_layout.tsx, ensure this order:
<AuthProvider>  {/* ← Must wrap everything */}
  <ThemeProvider>
    <UserPreferencesProvider>
      <Stack>
        {/* All screens here have access to auth */}
      </Stack>
    </UserPreferencesProvider>
  </ThemeProvider>
</AuthProvider>
```

### Fix 3: AuthProvider Not Mounted

**Error:**
```
⚠️ AuthProvider NOT mounted yet
```

**Fix:**
This is usually OK if it appears briefly. If persistent:

```typescript
// In app/_layout.tsx, increase delay:
setTimeout(() => {
  runDevChecklist();
  runDevScanRepair();
}, 200); // Increase from 100ms
```

## Manual Testing Commands

### Run Quick Scan
```typescript
import { quickScan } from '@/utils/scanAndRepair';

const result = quickScan();
console.log('Passed:', result.success);
console.log('Issues:', result.issues);
```

### Run Full Scan
```typescript
import { scanAndRepair } from '@/utils/scanAndRepair';

const result = scanAndRepair();
```

### Check Specific Module
```typescript
import { validateModule } from '@/utils/scanAndRepair';

const result = validateModule('@/constants/TherapistPersonas');
console.log('Valid:', result.success);
console.log('Error:', result.error);
```

### Check Auth Status
```typescript
import { checkAuthUsage } from '@/utils/scanAndRepair';

const isReady = checkAuthUsage();
console.log('Auth ready:', isReady);
```

## Files to Check When Issues Occur

1. **`constants/TherapistPersonas.ts`** - Check for stray tokens
2. **`contexts/AuthContext.tsx`** - Verify provider is exported
3. **`app/_layout.tsx`** - Check provider order
4. **`lib/safeGuards/providerGuards.tsx`** - Verify safe hooks exist

## Common Patterns

### Pattern 1: Safe Auth Access
```typescript
import { useAuthSafe } from '@/lib/safeGuards/providerGuards';

function MyComponent() {
  const { user, loading } = useAuthSafe();
  
  if (loading || !user) {
    return <LoadingScreen />;
  }
  
  return <MainContent user={user} />;
}
```

### Pattern 2: Conditional Rendering
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading } = useAuth();
  
  // Guard against null user
  if (loading) return <LoadingScreen />;
  if (!user) return <LoginScreen />;
  
  return <MainContent user={user} />;
}
```

### Pattern 3: Early Return
```typescript
function MyComponent() {
  const { user } = useAuth();
  
  // Early return if no user
  if (!user) {
    console.log('No user, redirecting...');
    return <Redirect href="/login" />;
  }
  
  return <MainContent user={user} />;
}
```

## Checklist Before Committing

- [ ] Run app and check console for checklist output
- [ ] Navigate to Home screen - no crashes
- [ ] Navigate to Chat screen - no crashes
- [ ] Navigate to Add Person screen - no crashes
- [ ] Check for any red error screens
- [ ] Verify all checks pass in console

## Emergency Fixes

### If App Won't Start

1. Check console for error messages
2. Look for "Can't find variable" errors
3. Check `constants/TherapistPersonas.ts` for stray tokens
4. Verify `app/_layout.tsx` has correct provider order

### If Screens Crash on Load

1. Check if screen uses `useAuth()`
2. Verify screen is under `AuthProvider` in route tree
3. Use `useAuthSafe()` instead of `useAuth()`
4. Add loading state to wait for auth

### If Checklist Shows Errors

1. Read the error message and suggested fix
2. Check the file mentioned in the error
3. Apply the suggested fix
4. Restart the app and verify

## Key Takeaways

✅ **Dev checklist runs automatically** on app startup
✅ **Safety guards prevent crashes** even if providers are missing
✅ **Clear error messages** tell you exactly what's wrong
✅ **Dev-only code** - no impact on production
✅ **No new dependencies** required

## Support

If you see an error not covered here:

1. Check the full error message in console
2. Look for stack traces showing where the error occurred
3. Verify provider order in `app/_layout.tsx`
4. Check if the file mentioned in the error has syntax issues
5. Use safe hooks (`useAuthSafe`) to prevent crashes
