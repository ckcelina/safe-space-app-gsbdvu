
# Quick Reference - Configuration

## Environment Variables

### Required
```env
EXPO_PUBLIC_SUPABASE_URL=https://zjzvkxvahrbuuyzjzxol.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Optional
```env
EXPO_PUBLIC_BACKEND_URL=https://your-backend.com
```

## Common Commands

```bash
# Setup
cp .env.example .env          # Create environment file
npm install                   # Install dependencies

# Development
npm run dev                   # Start with tunnel
npm run dev:lan              # Start with LAN
npm run dev:localhost        # Start with localhost

# Platform-specific
npm run ios                  # Run on iOS
npm run android              # Run on Android
npm run web                  # Run on web

# Build
npm run build:web            # Build for web
npm run build:android        # Prebuild for Android
```

## Configuration Check

```typescript
import { isSupabaseConfigured, isBackendConfigured } from '@/lib/supabase';
import { getConfigStatus, logConfigStatus } from '@/utils/configVerification';

// Check if configured
isSupabaseConfigured();      // true/false
isBackendConfigured();       // true/false

// Get detailed status
const status = getConfigStatus();

// Log to console (dev only)
logConfigStatus();
```

## Configuration Priority

1. `process.env.EXPO_PUBLIC_*` (from `.env`)
2. `Constants.expoConfig.extra.*` (from `app.config.ts`)
3. `Constants.manifest.extra.*` (legacy)

## File Locations

- `.env` - Local development credentials (not committed)
- `.env.example` - Template for developers
- `app.config.ts` - Expo configuration with fallbacks
- `lib/supabase.ts` - Supabase client with config reading
- `utils/configVerification.ts` - Configuration verification utilities

## Troubleshooting

### Configuration Error Screen
1. Create `.env` file
2. Add Supabase credentials
3. Restart dev server

### Environment Variables Not Loading
1. Ensure `EXPO_PUBLIC_` prefix
2. Restart dev server
3. Clear cache: `npm run dev -- --clear`

### Production Build Issues
1. Set EAS secrets: `eas secret:create`
2. Or add to `app.config.ts` extra section
3. Verify with `eas secret:list`

## Get Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Settings → API
4. Copy "Project URL" and "anon/public" key

## Current Project

- **Project ID:** zjzvkxvahrbuuyzjzxol
- **URL:** https://zjzvkxvahrbuuyzjzxol.supabase.co
- **Anon Key:** (see `.env` file)

## Support

- Configuration Guide: [CONFIGURATION_GUIDE.md](./CONFIGURATION_GUIDE.md)
- EAS Build Config: [eas-build-config.md](./eas-build-config.md)
- Main README: [README.md](./README.md)
