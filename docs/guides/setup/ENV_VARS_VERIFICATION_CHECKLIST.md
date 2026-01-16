
# Environment Variables - Verification Checklist

Use this checklist to verify the environment variable implementation is working correctly.

## Pre-Deployment Checklist

### ✅ Code Review

- [ ] `lib/supabase.ts` uses `process.env.EXPO_PUBLIC_SUPABASE_URL`
- [ ] `lib/supabase.ts` uses `process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] No hardcoded Supabase URLs or keys in source code
- [ ] Validation checks for non-empty strings
- [ ] Fallback client created when config is missing
- [ ] Configuration status exported for UI use

### ✅ UI Implementation

- [ ] `app/_layout.tsx` checks configuration before rendering
- [ ] Configuration error screen implemented
- [ ] Error screen shows missing variable names
- [ ] Error screen provides setup instructions
- [ ] Loading fallback prevents white screen
- [ ] No crashes when env vars are missing

### ✅ Logging

- [ ] Development logging is comprehensive
- [ ] Production logging is minimal
- [ ] Console shows clear status indicators (✅/❌)
- [ ] Error messages are actionable
- [ ] No sensitive data logged

### ✅ Documentation

- [ ] `ENVIRONMENT_VARIABLES_GUIDE.md` exists
- [ ] `ENV_VARS_QUICK_REFERENCE.md` exists
- [ ] `ENV_VARS_IMPLEMENTATION_SUMMARY.md` exists
- [ ] Documentation is clear and comprehensive
- [ ] Examples are accurate

## Testing Checklist

### Test 1: Missing Both Variables

**Setup:**
- Remove `EXPO_PUBLIC_SUPABASE_URL` from environment
- Remove `EXPO_PUBLIC_SUPABASE_ANON_KEY` from environment
- Restart app

**Expected Results:**
- [ ] App shows configuration error screen
- [ ] Error screen lists both missing variables
- [ ] Console shows detailed error messages (dev mode)
- [ ] No white screen
- [ ] No crashes

**Console Output Should Include:**
```
[Supabase] Environment variable check:
  - EXPO_PUBLIC_SUPABASE_URL: ❌ MISSING
  - EXPO_PUBLIC_SUPABASE_ANON_KEY: ❌ MISSING
[Supabase] ⚠️  Configuration incomplete!
```

### Test 2: Missing URL Only

**Setup:**
- Remove `EXPO_PUBLIC_SUPABASE_URL` from environment
- Keep `EXPO_PUBLIC_SUPABASE_ANON_KEY` in environment
- Restart app

**Expected Results:**
- [ ] App shows configuration error screen
- [ ] Error screen lists only URL as missing
- [ ] Console shows URL is missing, key is present
- [ ] No white screen
- [ ] No crashes

### Test 3: Missing Anon Key Only

**Setup:**
- Keep `EXPO_PUBLIC_SUPABASE_URL` in environment
- Remove `EXPO_PUBLIC_SUPABASE_ANON_KEY` from environment
- Restart app

**Expected Results:**
- [ ] App shows configuration error screen
- [ ] Error screen lists only anon key as missing
- [ ] Console shows URL is present, key is missing
- [ ] No white screen
- [ ] No crashes

### Test 4: Empty String Values

**Setup:**
- Set `EXPO_PUBLIC_SUPABASE_URL=""` (empty string)
- Set `EXPO_PUBLIC_SUPABASE_ANON_KEY=""` (empty string)
- Restart app

**Expected Results:**
- [ ] App shows configuration error screen
- [ ] Treated same as missing variables
- [ ] Console shows both as missing
- [ ] No white screen
- [ ] No crashes

### Test 5: Valid Configuration

**Setup:**
- Set `EXPO_PUBLIC_SUPABASE_URL` to valid URL
- Set `EXPO_PUBLIC_SUPABASE_ANON_KEY` to valid key
- Restart app

**Expected Results:**
- [ ] App loads normally
- [ ] No configuration error screen
- [ ] Console shows success messages
- [ ] Supabase client initialized
- [ ] All features work

**Console Output Should Include:**
```
[Supabase] Environment variable check:
  - EXPO_PUBLIC_SUPABASE_URL: ✅ Present
  - EXPO_PUBLIC_SUPABASE_ANON_KEY: ✅ Present
[Supabase] ✅ Client initialized successfully
```

### Test 6: Expo Go Compatibility

**Setup:**
- Open app in Expo Go
- Test with valid configuration
- Test with missing configuration

**Expected Results:**
- [ ] Valid config: App works normally
- [ ] Missing config: Error screen shows
- [ ] No crashes in either case
- [ ] Environment variables accessible

### Test 7: Natively Preview Compatibility

**Setup:**
- Open app in Natively Preview
- Test with valid configuration
- Test with missing configuration

**Expected Results:**
- [ ] Valid config: App works normally
- [ ] Missing config: Error screen shows
- [ ] No crashes in either case
- [ ] Environment variables accessible

### Test 8: Production Build Compatibility

**Setup:**
- Build production version (TestFlight/App Store)
- Test with valid configuration embedded

**Expected Results:**
- [ ] App works normally
- [ ] No development logs visible
- [ ] Environment variables embedded correctly
- [ ] No crashes

### Test 9: Variable Name Validation

**Setup:**
- Try using `SUPABASE_URL` (without EXPO_PUBLIC_ prefix)
- Try using `SUPABASE_ANON_KEY` (without EXPO_PUBLIC_ prefix)

**Expected Results:**
- [ ] Variables are undefined at runtime
- [ ] App shows configuration error screen
- [ ] Console indicates missing variables
- [ ] Documentation explains prefix requirement

### Test 10: Restart Behavior

**Setup:**
- Start with missing configuration
- Add environment variables
- Restart app

**Expected Results:**
- [ ] First run: Error screen shows
- [ ] After adding vars and restart: App loads normally
- [ ] Console shows updated status
- [ ] No cached invalid state

## Environment-Specific Checklist

### Expo Go
- [ ] Environment variables load from `.env` file
- [ ] Changes require dev server restart
- [ ] Error screen shows in Expo Go
- [ ] No crashes

### Natively Preview
- [ ] Environment variables load from dashboard
- [ ] Changes require preview restart
- [ ] Error screen shows in preview
- [ ] No crashes

### Development Build
- [ ] Environment variables embedded at build time
- [ ] Error screen shows if vars missing
- [ ] No crashes

### Production Build
- [ ] Environment variables embedded at build time
- [ ] App works with valid configuration
- [ ] Minimal logging
- [ ] No crashes

## Security Checklist

- [ ] No hardcoded secrets in source code
- [ ] `.env` file in `.gitignore`
- [ ] No secrets in version control
- [ ] Environment variables use EXPO_PUBLIC_ prefix
- [ ] Sensitive data not logged in production
- [ ] Error messages don't expose secrets

## Documentation Checklist

- [ ] Setup instructions are clear
- [ ] Troubleshooting guide is comprehensive
- [ ] Code examples are accurate
- [ ] Console output examples match reality
- [ ] Quick reference is helpful

## Performance Checklist

- [ ] Configuration check is fast
- [ ] No blocking operations during validation
- [ ] Fallback client doesn't impact performance
- [ ] Error screen renders quickly
- [ ] No memory leaks

## Accessibility Checklist

- [ ] Error messages are clear and readable
- [ ] Text has sufficient contrast
- [ ] Font sizes are appropriate
- [ ] Instructions are easy to follow
- [ ] No jargon in user-facing messages

## Final Verification

### All Tests Pass
- [ ] All 10 test scenarios completed successfully
- [ ] No white screens observed
- [ ] No crashes observed
- [ ] Error messages are helpful
- [ ] Console logs are clear

### All Environments Work
- [ ] Expo Go ✅
- [ ] Natively Preview ✅
- [ ] Development builds ✅
- [ ] Production builds ✅

### Documentation Complete
- [ ] All documentation files created
- [ ] All examples tested
- [ ] All instructions verified
- [ ] All troubleshooting steps work

### Success Criteria Met
- [ ] App no longer gets stuck on white screen
- [ ] Preview loads even if Supabase is misconfigured
- [ ] Proper UI message shown instead of crash
- [ ] Works in all Expo environments
- [ ] No hardcoded secrets

## Sign-Off

**Implementation Complete:** ✅

**Tested By:** _________________

**Date:** _________________

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

## Next Steps

After verification:
1. Deploy to Natively Preview
2. Test with real users
3. Monitor console logs
4. Gather feedback
5. Iterate if needed

## Support

If any checklist item fails:
1. Check console logs
2. Review documentation
3. Verify environment variable names
4. Ensure EXPO_PUBLIC_ prefix is used
5. Restart app/preview after changes
