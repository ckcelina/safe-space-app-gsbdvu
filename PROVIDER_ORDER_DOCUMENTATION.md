
# Provider Order Documentation

## ✅ CURRENT PROVIDER ORDER (CORRECT)

The app uses the following provider order in `app/_layout.tsx`:

```
ErrorBoundary (catches React errors)
  → GestureHandlerRootView (handles gestures)
    → SafeAreaProvider (safe area insets)
      → AuthProvider (authentication state)
        → ThemeProvider (theme/colors)
          → UserPreferencesProvider (user settings)
            → BiometricLockProvider (biometric lock)
              → NavigationThemeProvider (navigation theme)
                → WidgetProvider (widget state)
                  → Stack (expo-router)
```

## 🎯 WHY THIS ORDER MATTERS

### 1. **ErrorBoundary** (Outermost)
- **Purpose**: Catches any React errors and prevents blank screens
- **Must be outermost**: Needs to catch errors from all other providers
- **Safe fallback**: Shows error UI instead of crashing

### 2. **GestureHandlerRootView**
- **Purpose**: Enables gesture handling for the entire app
- **Must wrap everything**: Required for swipe gestures, modals, etc.

### 3. **SafeAreaProvider**
- **Purpose**: Provides safe area insets (notch, home indicator)
- **Required by**: All screens that use `useSafeAreaInsets()`
- **Must be high in tree**: Screens need this data immediately

### 4. **AuthProvider**
- **Purpose**: Provides authentication state and methods
- **Required by**: Login, signup, profile, and protected screens
- **Must be above screens**: All screens that call `useAuth()` must be descendants
- **Safe fallback**: `useAuth()` returns safe defaults if called outside provider

### 5. **ThemeProvider**
- **Purpose**: Provides theme colors and styling
- **Required by**: All screens that use `useThemeContext()`
- **Safe fallback**: Returns default theme if called outside provider

### 6. **UserPreferencesProvider**
- **Purpose**: Provides user preferences (AI tone, therapist persona, etc.)
- **Depends on**: AuthProvider (needs user ID)
- **Safe fallback**: Returns default preferences if called outside provider

### 7. **BiometricLockProvider**
- **Purpose**: Handles biometric lock screen
- **Depends on**: AuthProvider (needs user authentication)
- **Safe fallback**: Returns disabled state if called outside provider

### 8. **NavigationThemeProvider**
- **Purpose**: Provides theme to React Navigation
- **Must wrap Stack**: Required for navigation styling

### 9. **WidgetProvider**
- **Purpose**: Manages iOS widget state
- **Safe fallback**: Returns no-op function if called outside provider

### 10. **Stack** (Innermost)
- **Purpose**: Expo Router navigation
- **Must be innermost**: All screens are children of Stack

---

## 🛡️ SAFE FALLBACKS

All context hooks have safe fallbacks to prevent crashes:

### ✅ `useAuth()`
```typescript
if (context === undefined) {
  console.warn("⚠️ useAuth called outside AuthProvider. Returning safe fallback.");
  return {
    user: null,
    loading: false,
    signInWithEmail: async () => {},
    // ... other no-op functions
  };
}
```

### ✅ `useThemeContext()`
```typescript
if (context === undefined) {
  console.error("❌ useThemeContext must be used within ThemeProvider");
  return {
    themeKey: "OceanBlue",
    theme: oceanBlueTheme, // Default theme
    setTheme: async () => {},
  };
}
```

### ✅ `useWidget()`
```typescript
if (!context) {
  console.warn("useWidget must be used within a WidgetProvider. Returning safe fallback.");
  return {
    refreshWidget: () => {}, // No-op function
  };
}
```

### ✅ `useUserPreferences()`
```typescript
if (context === undefined) {
  console.error("❌ useUserPreferences must be used within UserPreferencesProvider");
  return {
    preferences: { ai_tone_id: DEFAULT_TONE_ID, ai_science_mode: false },
    loading: false,
    updatePreferences: async () => ({ success: false, error: "Provider not mounted" }),
    refreshPreferences: async () => {},
  };
}
```

### ✅ `useBiometricLock()`
```typescript
if (!context) {
  console.error("❌ useBiometricLock must be used within BiometricLockProvider");
  return {
    isLocked: false,
    isBiometricEnabled: false,
    isBiometricAvailable: false,
    setBiometricEnabled: async () => {},
    authenticate: async () => false,
    unlock: () => {},
  };
}
```

---

## 🚫 WHAT NOT TO DO

### ❌ Don't Duplicate Providers
```typescript
// BAD: Duplicate AuthProvider in nested layout
export default function TabLayout() {
  return (
    <AuthProvider> {/* ❌ Already in _layout.tsx! */}
      <Stack>
        <Stack.Screen name="home" />
      </Stack>
    </AuthProvider>
  );
}
```

### ❌ Don't Change Provider Order
```typescript
// BAD: UserPreferencesProvider before AuthProvider
<UserPreferencesProvider> {/* ❌ Needs AuthProvider first! */}
  <AuthProvider>
    <Stack />
  </AuthProvider>
</UserPreferencesProvider>
```

### ❌ Don't Remove Safe Fallbacks
```typescript
// BAD: Throwing error instead of safe fallback
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider"); // ❌ Crashes app!
  }
  return context;
}
```

---

## ✅ VERIFICATION

### Dev Tools
The app includes dev tools to verify provider setup:

1. **Dev Checklist** (`utils/devChecklist.ts`)
   - Runs on app startup (dev mode only)
   - Validates AuthProvider is mounted
   - Checks TherapistPersonas loads without errors
   - Verifies all contexts are available

2. **Dev Scan & Repair** (`utils/devScanRepair.ts`)
   - Scans for stray tokens in constants
   - Verifies provider order
   - Checks for safe guard hooks

3. **Provider Health Screen** (`app/(dev)/provider-health.tsx`)
   - Visual UI to check provider status
   - Run health checks manually
   - View scan results

### Access Dev Tools
Navigate to `/dev/provider-health` to view provider status.

---

## 📋 CHECKLIST FOR NEW PROVIDERS

When adding a new provider:

1. ✅ Add provider to `app/_layout.tsx` in correct order
2. ✅ Add safe fallback to hook (return defaults if context undefined)
3. ✅ Add console warning when hook called outside provider
4. ✅ Test that app doesn't crash if provider missing
5. ✅ Update this documentation
6. ✅ Add to dev checklist if critical

---

## 🎯 RESULT

With this setup:
- ✅ No "useAuth must be used within AuthProvider" errors
- ✅ No "Cannot read property 'primaryGradient' of undefined" errors
- ✅ No blank screens from provider crashes
- ✅ App always loads, even if providers misconfigured
- ✅ Clear console warnings for debugging
- ✅ Dev tools to verify setup

---

## 📚 RELATED FILES

- `app/_layout.tsx` - Root provider setup
- `contexts/AuthContext.tsx` - Auth provider with safe fallback
- `contexts/ThemeContext.tsx` - Theme provider with safe fallback
- `contexts/WidgetContext.tsx` - Widget provider with safe fallback
- `contexts/UserPreferencesContext.tsx` - Preferences provider with safe fallback
- `contexts/BiometricLockContext.tsx` - Biometric provider with safe fallback
- `utils/devChecklist.ts` - Startup validation
- `utils/devScanRepair.ts` - Runtime scanning
- `app/(dev)/provider-health.tsx` - Visual health check UI

---

## 🔧 TROUBLESHOOTING

### "useAuth must be used within AuthProvider"
- **Cause**: Screen calling `useAuth()` is not a descendant of `AuthProvider`
- **Fix**: Verify `AuthProvider` wraps the entire `Stack` in `app/_layout.tsx`
- **Safe fallback**: Hook returns safe defaults, app doesn't crash

### "Cannot read property 'primaryGradient' of undefined"
- **Cause**: Screen calling `useThemeContext()` before provider mounted
- **Fix**: Verify `ThemeProvider` wraps the entire `Stack` in `app/_layout.tsx`
- **Safe fallback**: Hook returns default theme, app doesn't crash

### "Provider not mounted" warnings in console
- **Cause**: Hook called very early in app lifecycle
- **Fix**: Usually resolves automatically as providers mount
- **Safe fallback**: Hook returns safe defaults until provider mounts

---

**Last Updated**: 2024
**Status**: ✅ All providers correctly ordered with safe fallbacks
