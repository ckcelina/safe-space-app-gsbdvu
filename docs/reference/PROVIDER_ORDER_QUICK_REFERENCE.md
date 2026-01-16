
# Provider Order Quick Reference

## 🎯 CORRECT PROVIDER ORDER

```typescript
// app/_layout.tsx
<ErrorBoundary>
  <GestureHandlerRootView>
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <UserPreferencesProvider>
            <BiometricLockProvider>
              <NavigationThemeProvider>
                <WidgetProvider>
                  <Stack>
                    {/* All screens here */}
                  </Stack>
                </WidgetProvider>
              </NavigationThemeProvider>
            </BiometricLockProvider>
          </UserPreferencesProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
</ErrorBoundary>
```

## ✅ SAFE HOOKS

All hooks have safe fallbacks - they never crash:

| Hook | Safe Fallback |
|------|---------------|
| `useAuth()` | Returns `{ user: null, loading: false, ...no-ops }` |
| `useThemeContext()` | Returns default Ocean Blue theme |
| `useWidget()` | Returns `{ refreshWidget: () => {} }` |
| `useUserPreferences()` | Returns default preferences |
| `useBiometricLock()` | Returns disabled state |

## 🚫 RULES

1. ❌ **Never duplicate providers** in nested layouts
2. ❌ **Never change provider order** without updating this doc
3. ❌ **Never remove safe fallbacks** from hooks
4. ✅ **Always wrap Stack** with all providers in `_layout.tsx`
5. ✅ **Always add safe fallbacks** to new context hooks

## 🔍 VERIFY SETUP

```bash
# Navigate to dev tools
# URL: /dev/provider-health
```

## 📋 ADDING NEW PROVIDER

```typescript
// 1. Create context with safe fallback
export function useMyContext() {
  const context = useContext(MyContext);
  if (context === undefined) {
    console.warn("⚠️ useMyContext called outside provider");
    return { /* safe defaults */ };
  }
  return context;
}

// 2. Add to _layout.tsx in correct position
<ExistingProvider>
  <MyNewProvider>  {/* Add here */}
    <Stack />
  </MyNewProvider>
</ExistingProvider>

// 3. Test that app doesn't crash if provider missing
```

## 🎯 RESULT

✅ No provider crashes  
✅ No "must be used within Provider" errors  
✅ App always loads  
✅ Clear console warnings for debugging  

---

**See full documentation**: `PROVIDER_ORDER_DOCUMENTATION.md`
