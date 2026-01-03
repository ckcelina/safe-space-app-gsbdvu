
# EAS Build Configuration

This guide explains how to configure your app for production builds with EAS (Expo Application Services).

## Prerequisites

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to your Expo account:
   ```bash
   eas login
   ```

## Configure EAS Secrets

Instead of hardcoding credentials in `app.config.ts`, use EAS secrets:

### 1. Set Supabase Credentials

```bash
# Set Supabase URL
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://zjzvkxvahrbuuyzjzxol.supabase.co --type string

# Set Supabase Anon Key
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your-anon-key-here --type string
```

### 2. Set Backend URL (Optional)

```bash
# Only if using custom backend
eas secret:create --scope project --name EXPO_PUBLIC_BACKEND_URL --value https://your-backend.com --type string
```

### 3. Verify Secrets

```bash
eas secret:list
```

## Update eas.json

Your `eas.json` should reference these secrets:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://zjzvkxvahrbuuyzjzxol.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-dev-anon-key"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://zjzvkxvahrbuuyzjzxol.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-staging-anon-key"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://zjzvkxvahrbuuyzjzxol.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-prod-anon-key"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Build Commands

### Development Build
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Preview Build
```bash
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

### Production Build
```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

## Environment-Specific Configuration

### Development
- Uses development Supabase project
- Includes debugging tools
- Faster build times

### Preview
- Uses staging Supabase project
- Internal distribution (TestFlight, Internal Testing)
- Production-like environment

### Production
- Uses production Supabase project
- App Store / Play Store distribution
- Optimized and minified

## Verify Configuration in Build

After building, you can verify the configuration is correct:

1. Install the build on a device
2. Check the console logs for configuration status
3. Verify Supabase connection works

## Troubleshooting

### Build Fails with "Configuration Missing"

**Problem:** EAS build fails because environment variables are not set.

**Solution:**
1. Verify secrets are set: `eas secret:list`
2. Check `eas.json` has correct `env` section
3. Ensure variable names match exactly (case-sensitive)

### App Shows Configuration Error After Build

**Problem:** Production app shows "Configuration Required" screen.

**Solution:**
1. Verify secrets were included in build
2. Check `app.config.ts` has fallback values
3. Ensure `EXPO_PUBLIC_` prefix is used

### Different Credentials for Different Environments

**Problem:** Need different Supabase projects for dev/staging/prod.

**Solution:**
Use different values in each build profile:

```json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://dev-project.supabase.co"
      }
    },
    "preview": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://staging-project.supabase.co"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://prod-project.supabase.co"
      }
    }
  }
}
```

## Security Best Practices

1. **Never commit secrets to git** - Use EAS secrets or environment variables
2. **Use different keys per environment** - Dev, staging, and production should have separate credentials
3. **Rotate keys regularly** - Especially after team member changes
4. **Enable RLS in Supabase** - Protect your data with Row Level Security policies
5. **Monitor API usage** - Watch for unusual patterns in Supabase dashboard

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Secrets](https://docs.expo.dev/build-reference/variables/)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
