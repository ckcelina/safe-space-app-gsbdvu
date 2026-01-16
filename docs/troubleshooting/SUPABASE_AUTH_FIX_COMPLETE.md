
# ✅ Supabase Auth Wiring Fix - Complete

## What Was Fixed

### 1. **Canonical Supabase Client** (`lib/supabase.ts`)
- ✅ Single Supabase client instance with AsyncStorage for session persistence
- ✅ Reads credentials from `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- ✅ Fallback to `Constants.expoConfig.extra` for Expo Go compatibility
- ✅ Defensive error logging (logs once, doesn't spam)

### 2. **Auth Context** (`contexts/AuthContext.tsx`)
- ✅ Proper session initialization with `supabase.auth.getSession()`
- ✅ Subscribes to `onAuthStateChange` for real-time auth updates
- ✅ Unsubscribes on unmount to prevent memory leaks
- ✅ Uses `loading` state to prevent premature rendering
- ✅ **Removed auto-signout logic** - only signs out when explicitly requested
- ✅ Session persists via AsyncStorage (Expo Go compatible)

### 3. **Provider Order** (`app/_layout.tsx`)
- ✅ Correct provider hierarchy:
  ```tsx
  <AuthProvider>
    <ThemeProvider>
      <UserPreferencesProvider>
        <WidgetProvider>
          {/* App content */}
        </WidgetProvider>
      </UserPreferencesProvider>
    </ThemeProvider>
  </AuthProvider>
  ```

### 4. **AuthGate Component** (`components/AuthGate.tsx`)
- ✅ Shows loading spinner while checking session
- ✅ Redirects to `/onboarding` if no session
- ✅ Renders children if authenticated
- ✅ Fixed import to use correct `AuthContext`

### 5. **App Configuration** (`app.json`)
- ✅ Added `supabaseUrl` and `supabaseAnonKey` to `expo.extra`
- ✅ Provides fallback for Expo Go when env vars aren't available

### 6. **Cleanup**
- ✅ Removed duplicate `contexts/SupabaseAuthContext.tsx`
- ✅ All files now use the canonical `contexts/AuthContext.tsx`

## How Session Persistence Works

1. **AsyncStorage**: Supabase client uses `@react-native-async-storage/async-storage` to persist sessions
2. **Auto-refresh**: `autoRefreshToken: true` automatically refreshes expired tokens
3. **Persistent**: `persistSession: true` saves session to AsyncStorage
4. **No URL detection**: `detectSessionInUrl: false` (not needed for mobile)

## Setup Instructions

### 1. Add Environment Variables

Create a `.env` file in the project root:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Update app.json (Optional - for Expo Go fallback)

If you want to test in Expo Go without env vars, update `app.json`:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://your-project.supabase.co",
      "supabaseAnonKey": "your-anon-key-here"
    }
  }
}
```

**⚠️ Warning**: Don't commit secrets to `app.json` in production. Use environment variables instead.

### 3. Restart Expo Dev Server

```bash
npm run dev
```

## Testing Checklist

- [ ] App boots without "Missing Supabase credentials" error
- [ ] No "Cannot read property 'getSession' of undefined" error
- [ ] No "useAuth must be used within AuthProvider" error
- [ ] User can sign up successfully
- [ ] User can log in successfully
- [ ] User remains logged in after closing and reopening the app
- [ ] User can log out successfully
- [ ] Session persists across app restarts (Expo Go)

## Troubleshooting

### "Missing Supabase credentials" error

**Solution**: Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to your `.env` file or `app.json` extra section.

### User gets logged out on app restart

**Possible causes**:
1. AsyncStorage not working properly
2. Session expired (check Supabase Auth settings)
3. App cache cleared

**Solution**: 
- Check that `@react-native-async-storage/async-storage` is installed
- Verify Supabase Auth settings allow persistent sessions
- Check Expo Go cache settings

### "useAuth must be used within AuthProvider" error

**Solution**: This should be fixed. If you still see it, ensure:
1. `AuthProvider` wraps your entire app in `app/_layout.tsx`
2. You're importing from `@/contexts/AuthContext` (not the deleted `SupabaseAuthContext`)

## What Changed

### Before
- Two conflicting AuthContext implementations
- Session not persisting reliably
- Auto-signout on app foreground/background
- Missing provider wrapping
- Credentials not loading from env vars

### After
- Single canonical AuthContext
- Session persists via AsyncStorage
- Only signs out when explicitly requested
- Proper provider hierarchy
- Credentials load from env vars with fallback

## No UI Changes

✅ All fixes are internal - no UI/UX changes
✅ Existing screens and styles unchanged
✅ Expo Go compatibility maintained
