
# Configuration Guide

This guide explains how to configure your Safe Space app with Supabase and optional backend services.

## Quick Start

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Add your Supabase credentials to `.env`:**
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Restart the Expo dev server:**
   ```bash
   npm run dev
   ```

## Configuration Priority

The app reads configuration in the following priority order:

1. **Environment Variables** (Preferred) - `EXPO_PUBLIC_*` variables from `.env`
2. **Expo Config** - `expo.extra.*` from `app.config.ts`
3. **Legacy Manifest** - `Constants.manifest.extra` (older Expo versions)

## Required Configuration

### Supabase (Required)

Your app **requires** Supabase credentials to function:

```env
EXPO_PUBLIC_SUPABASE_URL=https://zjzvkxvahrbuuyzjzxol.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these:**
- Log in to [Supabase Dashboard](https://app.supabase.com)
- Select your project
- Go to Settings → API
- Copy the "Project URL" and "anon/public" key

### Backend URL (Optional)

The backend URL is **optional** for Supabase-only apps:

```env
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

Only add this if you're using a custom backend API in addition to Supabase.

## Configuration Files

### `.env` (Local Development)

Create this file in your project root with your actual credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://zjzvkxvahrbuuyzjzxol.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:** This file is in `.gitignore` and will not be committed to version control.

### `app.config.ts` (Production)

For production builds, add your credentials to `app.config.ts`:

```typescript
export default {
  expo: {
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co",
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key",
      backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || "", // Optional
    }
  }
}
```

## Verification

### Check Configuration Status

The app automatically logs configuration status on startup in development mode:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Configuration Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 Supabase:
  ✓ Configured: ✅
  ✓ URL: https://zjzvkxvahrbuuyzjzxol.supabase.co
  ✓ Has Anon Key: ✅
  ✓ Source: env

🌐 Backend:
  ✓ Configured: ❌ (Optional)
  ✓ URL: Not set (Optional)
  ✓ Source: none

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Manual Verification

You can also check configuration programmatically:

```typescript
import { isSupabaseConfigured, isBackendConfigured } from '@/lib/supabase';
import { getConfigStatus } from '@/utils/configVerification';

// Check if Supabase is configured
console.log('Supabase configured:', isSupabaseConfigured());

// Check if backend is configured (optional)
console.log('Backend configured:', isBackendConfigured());

// Get detailed status
const status = getConfigStatus();
console.log('Config status:', status);
```

## Troubleshooting

### "Supabase not configured" Error

**Problem:** You see a configuration error screen in development.

**Solution:**
1. Ensure `.env` file exists in project root
2. Verify `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set
3. Restart the Expo dev server: `npm run dev`
4. Clear cache if needed: `npm run dev -- --clear`

### Configuration Not Loading

**Problem:** Environment variables are not being read.

**Solution:**
1. Ensure variable names start with `EXPO_PUBLIC_`
2. Restart the Expo dev server (required after `.env` changes)
3. Check that `dotenv` is installed: `npm install dotenv`
4. Verify `app.config.ts` imports `dotenv/config` at the top

### Production Build Issues

**Problem:** App works in development but not in production builds.

**Solution:**
1. Add credentials to `app.config.ts` `extra` section
2. Or set environment variables in your build environment (EAS, etc.)
3. For EAS builds, use `eas.json` secrets:
   ```json
   {
     "build": {
       "production": {
         "env": {
           "EXPO_PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
           "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key"
         }
       }
     }
   }
   ```

## Security Best Practices

1. **Never commit `.env` to version control** - It's in `.gitignore` by default
2. **Use environment-specific credentials** - Different keys for dev/staging/production
3. **Rotate keys regularly** - Especially if they're exposed
4. **Use Row Level Security (RLS)** - Protect your Supabase data with RLS policies
5. **Keep anon key public-safe** - The anon key is meant to be public, but still protect it

## Environment-Specific Configuration

### Development
```env
EXPO_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key
```

### Staging
```env
EXPO_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=staging-anon-key
```

### Production
```env
EXPO_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
```

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Expo Config](https://docs.expo.dev/workflow/configuration/)
- [EAS Build Secrets](https://docs.expo.dev/build-reference/variables/)

## Support

If you encounter issues:
1. Check the configuration status logs in development mode
2. Verify your Supabase project is active
3. Ensure your API keys are correct
4. Try clearing the Expo cache: `npm run dev -- --clear`
