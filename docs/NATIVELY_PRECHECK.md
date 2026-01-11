
# Natively Pre-Flight Checklist

Before each Natively run, execute this one-line checklist to prevent breakage:

```bash
PRECHECK: yarn lint && npx tsc --noEmit && npx expo-doctor && echo "✅ Verify app/_layout providers wrap <Slot />" && echo "✅ Verify Supabase env vars exist" && echo "✅ Ready to run in Expo Go"
```

## What This Checks

1. **Linting** - Ensures code follows style rules
2. **Type checking** - Catches TypeScript errors before runtime
3. **Expo Doctor** - Validates Expo configuration
4. **Provider hierarchy** - Manual reminder to check AuthProvider wraps all routes
5. **Environment variables** - Manual reminder to verify Supabase credentials
6. **Expo Go readiness** - Confirms app is ready to run

## Quick Script (Optional)

Add to package.json scripts:

```json
"precheck": "eslint . && tsc --noEmit && expo-doctor"
```

Then run: `yarn precheck`

---

**Note:** This is a dev-only checklist and does not affect production builds.
