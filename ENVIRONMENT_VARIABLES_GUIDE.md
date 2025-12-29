
# Environment Variables Guide

## Overview

This guide explains how environment variables work in Safe Space, specifically for Supabase configuration in Expo 54 + Natively.

## Required Environment Variables

Safe Space requires two environment variables to connect to Supabase:

- **EXPO_PUBLIC_SUPABASE_URL**: Your Supabase project URL
- **EXPO_PUBLIC_SUPABASE_ANON_KEY**: Your Supabase anonymous/public API key

## Why EXPO_PUBLIC_ Prefix?

The `EXPO_PUBLIC_` prefix is **required** for environment variables to be available at runtime in:

- ✅ Expo Go
- ✅ Natively Preview
- ✅ Development builds
- ✅ Production builds (TestFlight, App Store)

Variables without this prefix are only available during build time and will be `undefined` at runtime.

## How to Set Environment Variables

### In Natively Dashboard

1. Open your project in the Natively dashboard
2. Navigate to **Environment Variables** section
3. Add the following variables:
   - Name: `EXPO_PUBLIC_SUPABASE_URL`
   - Value: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
   - Name: `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - Value: Your Supabase anon key
4. Save and restart the preview

### In Local Development (.env file)

Create a `.env` file in the project root:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Never commit the `.env` file to version control. It should be in `.gitignore`.

## How It Works

### 1. Environment Variable Access

The app accesses environment variables using `process.env`:

```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';
```

### 2. Runtime Validation

On app startup, the code validates that both variables are:
- Present (not `undefined`)
- Non-empty strings
- Properly trimmed

```typescript
const hasValidUrl = typeof supabaseUrl === 'string' && supabaseUrl.length > 0;
const hasValidAnonKey = typeof supabaseAnonKey === 'string' && supabaseAnonKey.length > 0;
const hasSupabaseConfig = hasValidUrl && hasValidAnonKey;
```

### 3. Graceful Fallback

If configuration is missing or invalid:

- ❌ **Does NOT crash** the app
- ✅ Shows a user-friendly configuration error screen
- ✅ Logs helpful debugging information (dev mode only)
- ✅ Creates a fallback Supabase client that returns graceful errors

### 4. Configuration Error Screen

When environment variables are missing, users see:

```
🔧 Configuration Required

Safe Space needs Supabase configuration to work.

Please add the following environment variables:
• EXPO_PUBLIC_SUPABASE_URL
• EXPO_PUBLIC_SUPABASE_ANON_KEY
```

## Troubleshooting

### White Screen on Startup

**Cause**: Environment variables are missing or invalid.

**Solution**:
1. Check that variables are set in Natively dashboard
2. Verify the `EXPO_PUBLIC_` prefix is present
3. Ensure values are not empty strings
4. Restart the preview after adding variables

### Variables Not Available at Runtime

**Cause**: Variables don't have the `EXPO_PUBLIC_` prefix.

**Solution**: Rename variables to include the prefix:
- ❌ `SUPABASE_URL` → ✅ `EXPO_PUBLIC_SUPABASE_URL`
- ❌ `SUPABASE_ANON_KEY` → ✅ `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Development vs Production

**Development** (Expo Go, Natively Preview):
- Variables are read from `.env` file or dashboard
- Changes require app restart
- Detailed error logging is enabled

**Production** (TestFlight, App Store):
- Variables are embedded at build time
- Must be set before building
- Error logging is minimal

## Security Best Practices

### ✅ DO:
- Use the `EXPO_PUBLIC_` prefix for client-side variables
- Store sensitive keys in environment variables
- Add `.env` to `.gitignore`
- Use different keys for development and production

### ❌ DON'T:
- Hardcode API keys in source code
- Commit `.env` files to version control
- Use production keys in development
- Share API keys publicly

## Implementation Details

### File: `lib/supabase.ts`

This file handles:
- Reading environment variables
- Validating configuration
- Creating Supabase client (real or fallback)
- Exporting configuration status

### File: `app/_layout.tsx`

This file handles:
- Early configuration check
- Rendering fallback UI if config is missing
- Preventing white screen crashes
- Showing helpful error messages

## Testing

### Test Missing Configuration

1. Remove environment variables from dashboard
2. Restart preview
3. Verify configuration error screen appears
4. Check console for helpful error messages

### Test Valid Configuration

1. Add environment variables to dashboard
2. Restart preview
3. Verify app loads normally
4. Check console for success messages

## Console Output

### When Configuration is Valid

```
[Supabase] Environment variable check:
  - EXPO_PUBLIC_SUPABASE_URL: ✅ Present
  - EXPO_PUBLIC_SUPABASE_ANON_KEY: ✅ Present
[Supabase] ✅ Client initialized successfully
```

### When Configuration is Missing

```
[Supabase] Environment variable check:
  - EXPO_PUBLIC_SUPABASE_URL: ❌ MISSING
  - EXPO_PUBLIC_SUPABASE_ANON_KEY: ❌ MISSING
[Supabase] ⚠️  Configuration incomplete!
[Supabase] App will show configuration error screen
[Supabase] To fix: Add environment variables in Natively dashboard
```

## Summary

✅ **Success Criteria Met**:
- App no longer gets stuck on white screen
- Preview loads even if Supabase is misconfigured
- Proper UI message is shown instead of crash
- Works in Expo Go, Natively Preview, and production
- No secrets are hardcoded

✅ **Compatibility**:
- Expo Go ✅
- Natively Preview ✅
- Development builds ✅
- Production builds ✅

✅ **User Experience**:
- Clear error messages
- Helpful debugging information
- No crashes or white screens
- Graceful degradation
