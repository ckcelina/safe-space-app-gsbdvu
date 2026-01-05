# Provider Wiring Fix — Hydration Gates Complete

## Problem

Screens were rendering before providers were ready, causing errors:
- ❌ "useAuth must be used within AuthProvider"
- ❌ "useThemeContext must be used within a ThemeProvider"
- ❌ Happened on app startup, hot reload, and route changes

## Root Cause

**No Hydration Gate**: Screens could render before providers finished initializing:
1. App starts → Providers mount → Start loading data
2. Stack immediately renders routes
3. Routes call `useAuth()` or `useThemeContext()`
4. **ERROR**: Context not ready yet

**Race Condition**: The time between provider mount and data load was enough for screens to render and crash.

## Solution

Added **hydration gates** to ensure screens only render after providers are ready.

### 1. ThemeProvider Hydration Tracking ✅

**File**: `contexts/ThemeContext.tsx`

**Added**:
```typescript
interface ThemeContextType {
  themeKey: ThemeKey;
  theme: Theme;
  setTheme: (themeKey: ThemeKey) => Promise<void>;
  isHydrated: boolean; // NEW: Tracks when theme is loaded
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  const loadTheme = useCallback(async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && savedTheme in themes) {
        const key = savedTheme as ThemeKey;
        setThemeKey(key);
        setThemeState(themes[key]);
      }
    } catch (error) {
      console.error('[ThemeProvider] Error loading theme:', error);
    } finally {
      // CRITICAL: Always set hydrated, even on error
      setIsHydrated(true);
    }
  }, []);
}
```

**Why it works**:
- ✅ `isHydrated` starts as `false`
- ✅ Loads theme from AsyncStorage asynchronously
- ✅ Sets `isHydrated = true` in `finally` (always runs)
- ✅ Uses default theme on error (never blocks)

### 2. HydrationGate Component ✅

**File**: `components/HydrationGate.tsx` (NEW)

**Purpose**: Show loading screen while providers initialize

```typescript
interface HydrationGateProps {
  authLoading: boolean;      // From AuthProvider
  themeHydrated: boolean;     // From ThemeProvider
  children: React.ReactNode;
}

export function HydrationGate({ authLoading, themeHydrated, children }: HydrationGateProps) {
  const isHydrating = authLoading || !themeHydrated;

  if (isHydrating) {
    return (
      <View style={styles.container}>
        <SafeSpaceLogo size={120} useGradient />
        <ActivityIndicator size="large" color="#1890FF" />
      </View>
    );
  }

  return <>{children}</>;
}
```

**Loading Conditions**:
- Shows loading screen if: `authLoading === true` OR `themeHydrated === false`
- Renders children only when: `authLoading === false` AND `themeHydrated === true`

**Visual**:
- Black background with Safe Space logo (gradient)
- Activity indicator below logo
- Clean, professional loading experience

### 3. Root Layout Restructure ✅

**File**: `app/_layout.tsx`

**Before** (BROKEN):
```typescript
<AuthProvider>
  <ThemeProvider>
    <Stack>  {/* ❌ Renders immediately, providers not ready */}
      <Stack.Screen name="(tabs)" />
      {/* ... */}
    </Stack>
  </ThemeProvider>
</AuthProvider>
```

**After** (FIXED):
```typescript
export default function RootLayout() {
  return (
    <GestureHandlerRootView>
      <ErrorBoundary>
        <AuthProvider>
          <ThemeProvider>
            <LayoutContent />  {/* ✅ Can access contexts */}
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

function LayoutContent() {
  const { loading: authLoading } = useAuth();  // ✅ Safe - inside providers
  const { isHydrated: themeHydrated } = useThemeContext();  // ✅ Safe

  return (
    <HydrationGate authLoading={authLoading} themeHydrated={themeHydrated}>
      <UserPreferencesProvider>
        <WidgetProvider>
          <Stack>  {/* ✅ Only renders when providers ready */}
            {/* screens */}
          </Stack>
        </WidgetProvider>
      </UserPreferencesProvider>
    </HydrationGate>
  );
}
```

**Key Changes**:
1. ✅ Created `LayoutContent` component that renders **inside** providers
2. ✅ `LayoutContent` can safely call `useAuth()` and `useThemeContext()`
3. ✅ `HydrationGate` prevents `Stack` from rendering until ready
4. ✅ Providers never conditionally mount/unmount

## Provider Hierarchy

**Final Structure** (top to bottom):
```
GestureHandlerRootView
  └─ ErrorBoundary
      └─ AuthProvider
          └─ ThemeProvider
              └─ LayoutContent (can access auth + theme)
                  └─ HydrationGate (waits for both)
                      └─ UserPreferencesProvider
                          └─ WidgetProvider
                              └─ Stack (routes)
```

**Critical Rules**:
- ✅ Providers NEVER conditionally mount/unmount
- ✅ Providers always exist at root
- ✅ Only `<Stack>` content changes based on route
- ✅ Screens only render after hydration complete

## How It Works

### Cold Start Flow

1. **App Boots**
   ```
   GestureHandlerRootView mounts
   ↓
   ErrorBoundary mounts
   ↓
   AuthProvider mounts → Starts loading session from SecureStore
   ↓
   ThemeProvider mounts → Starts loading theme from AsyncStorage
   ↓
   LayoutContent mounts → Can access contexts safely
   ```

2. **Hydration Phase**
   ```
   authLoading = true, themeHydrated = false
   ↓
   HydrationGate shows loading screen
   ↓
   User sees: Safe Space logo + spinner
   ```

3. **Data Loads**
   ```
   Auth: getSession() completes → authLoading = false
   Theme: loadTheme() completes → themeHydrated = true
   ```

4. **App Ready**
   ```
   authLoading = false, themeHydrated = true
   ↓
   HydrationGate renders children
   ↓
   Stack mounts → Routes render
   ↓
   Screens can safely use useAuth() and useThemeContext()
   ```

### Hot Reload Flow

1. **Hot Reload Triggered**
   ```
   Providers stay mounted (no re-initialization)
   ↓
   authLoading already false, themeHydrated already true
   ↓
   HydrationGate immediately renders children
   ↓
   No loading screen flash
   ```

## Benefits

### 🎯 Eliminates Provider Errors
- ✅ No more "must be used within Provider" errors
- ✅ Screens only render when providers are ready
- ✅ Safe to call hooks anywhere in app

### ⚡ Better Loading UX
- ✅ Shows branded loading screen on cold start
- ✅ No flash of loading screen on hot reload
- ✅ Professional, polished experience

### 🏗️ Clean Architecture
- ✅ Providers never conditionally mount
- ✅ Clear separation of concerns
- ✅ Easy to debug hydration state

### 🧪 Expo Go Compatible
- ✅ No native code changes
- ✅ No ejection required
- ✅ Works in development and production

## Testing Checklist

### ✅ Provider Error Prevention

1. **Cold Start**
   - [ ] Open app from closed state
   - [ ] Should see loading screen briefly
   - [ ] Should NOT see provider errors in console
   - [ ] App loads successfully

2. **Hot Reload**
   - [ ] Make code change
   - [ ] Reload app (shake → reload)
   - [ ] Should NOT see provider errors
   - [ ] App reloads successfully

3. **Navigation**
   - [ ] Navigate to different screens
   - [ ] All screens can use `useAuth()`
   - [ ] All screens can use `useThemeContext()`
   - [ ] No errors in console

### ✅ Loading Screen

1. **Visual Check**
   - [ ] Shows Safe Space logo (gradient version)
   - [ ] Shows activity indicator
   - [ ] Black background
   - [ ] Centered layout

2. **Timing**
   - [ ] Appears on cold start
   - [ ] Disappears when data loaded (< 1 second)
   - [ ] Does NOT flash on hot reload

## Console Logs

**Expected logs on cold start**:
```
[AuthContext] Initializing...
[ThemeProvider] Loading theme from storage...
[HydrationGate] Waiting for providers... { authLoading: true, themeHydrated: false }
[AuthContext] Initial session: user@example.com (or "No session")
[ThemeProvider] Loaded saved theme: OceanBlue
[ThemeProvider] Theme hydration complete
[HydrationGate] Providers ready, rendering app
[App] Initializing app...
```

## Troubleshooting

### Still seeing provider errors?

**Check 1**: Verify providers are always mounted
```typescript
// ❌ WRONG - conditional providers
{session && <AuthProvider>...</AuthProvider>}

// ✅ CORRECT - always mounted
<AuthProvider>
  {session && <SomeScreen />}
</AuthProvider>
```

**Check 2**: Verify LayoutContent is inside providers
```typescript
// ❌ WRONG - can't access contexts
function RootLayout() {
  const { loading } = useAuth(); // Error!
}

// ✅ CORRECT - inside providers
function LayoutContent() {
  const { loading } = useAuth(); // Works!
}
```

**Check 3**: Check console for hydration logs
- Should see "Theme hydration complete"
- Should see "Providers ready, rendering app"

### Loading screen showing too long?

**Check 1**: Auth loading stuck?
- Check logs for "Initial session" message
- Verify SecureStore working (see AUTH_PERSISTENCE_FIX.md)

**Check 2**: Theme not hydrating?
- Check logs for "Theme hydration complete"
- Verify AsyncStorage working
- Check for errors in loadTheme()

## Related Files

- ✅ `contexts/ThemeContext.tsx` (added isHydrated)
- ✅ `components/HydrationGate.tsx` (new)
- ✅ `app/_layout.tsx` (restructured)
- ✅ `contexts/AuthContext.tsx` (already had loading state)

## Architecture Decisions

### Why LayoutContent Component?

**Problem**: Can't call hooks at root level before providers mount

**Solution**: Create inner component that renders inside providers
- ✅ Can safely access contexts
- ✅ Can pass hydration state to HydrationGate
- ✅ Clean separation

### Why finally Block in loadTheme?

**Problem**: If loading theme fails, app hangs forever

**Solution**: Always set `isHydrated = true` in finally
- ✅ Runs even if error occurs
- ✅ Uses default theme on error
- ✅ Never blocks app startup

### Why Two Hydration Checks?

**Problem**: Both auth and theme load asynchronously

**Solution**: Wait for both to complete
- ✅ Auth: Loads session from SecureStore (encrypted, slower)
- ✅ Theme: Loads from AsyncStorage (faster)
- ✅ Both must complete before screens render

---

**Status**: ✅ COMPLETE
**Tested**: Manual testing recommended (see checklist)
**Deployed**: Ready to test in Expo Go
**Breaking Changes**: None
**Expo Go Compatible**: Yes
