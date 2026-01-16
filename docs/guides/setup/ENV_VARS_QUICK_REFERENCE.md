
# Environment Variables - Quick Reference

## Required Variables

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## ⚠️ Critical Rules

1. **MUST** use `EXPO_PUBLIC_` prefix
2. **MUST** be non-empty strings
3. **MUST** restart app after changes
4. **NEVER** commit to version control

## Quick Setup

### Natively Dashboard
1. Open Environment Variables
2. Add both variables
3. Save
4. Restart preview

### Local Development
1. Create `.env` file in project root
2. Add variables (see above)
3. Restart dev server

## Validation

### ✅ Valid Configuration
```
[Supabase] ✅ Client initialized successfully
```

### ❌ Invalid Configuration
```
[Supabase] ⚠️  Configuration incomplete!
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| White screen | Add missing env vars |
| Variables undefined | Add `EXPO_PUBLIC_` prefix |
| Changes not applied | Restart app/preview |
| Still not working | Check console logs |

## Code Access

```typescript
// ✅ Correct
process.env.EXPO_PUBLIC_SUPABASE_URL

// ❌ Wrong
process.env.SUPABASE_URL
```

## Files to Check

- `lib/supabase.ts` - Client initialization
- `app/_layout.tsx` - Configuration check
- `.env` - Local environment variables (don't commit!)

## Success Indicators

✅ No white screen
✅ Configuration error screen shows if missing
✅ Console shows clear status messages
✅ App loads normally when configured

## Need Help?

Check `ENVIRONMENT_VARIABLES_GUIDE.md` for detailed documentation.
