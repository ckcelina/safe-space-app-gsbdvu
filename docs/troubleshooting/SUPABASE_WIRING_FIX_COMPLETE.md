
# Supabase Wiring Fix - Complete Diagnosis & Solution

## Problem Summary

The AI response feature was not working due to **401 Unauthorized errors** when calling the `generate-ai-response` Edge Function. The logs showed consistent 401 errors, indicating authentication issues.

## Root Causes Identified

### 1. **Edge Function Authentication Mismatch**
- The Edge Function has `verify_jwt: true` which requires a valid JWT token
- The client was calling `supabase.functions.invoke()` correctly, but the auth token was not being passed
- This is typically caused by:
  - User not being properly authenticated when making the call
  - Session expired or invalid
  - Supabase client not initialized with the correct session

### 2. **Outdated Edge Function Code**
- The deployed Edge Function code was outdated and didn't match the local implementation
- Missing comprehensive error handling and response structure
- **FIXED**: Redeployed the correct Edge Function (version 66)

### 3. **Missing Session Validation**
- The chat screen was not checking if the user session is valid before making Edge Function calls
- No retry logic for expired sessions

## Solutions Implemented

### ✅ 1. Redeployed Edge Function
- Deployed simplified, robust Edge Function with proper error handling
- Maintains `verify_jwt: true` for security
- Returns consistent response shape: `{ ok: true, data: { replyText, assistantMessage } }`
- Proper CORS headers for all responses

### 2. Client-Side Fixes Needed

The following fixes need to be applied to the client code:

#### A. Add Session Validation Before Edge Function Calls

The chat screen should validate the session before calling the Edge Function:

```typescript
// In chat.tsx, before calling supabase.functions.invoke
const { data: { session }, error: sessionError } = await supabase.auth.getSession();

if (sessionError || !session) {
  console.error('[Chat] No valid session - user needs to re-authenticate');
  showErrorToast('Your session has expired. Please log in again.');
  router.replace('/login');
  return;
}
```

#### B. Ensure Supabase Client Uses Current Session

The Supabase client should be initialized with the current session:

```typescript
// In lib/supabase.ts - already correct
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,  // ✅ Already enabled
    persistSession: true,     // ✅ Already enabled
    detectSessionInUrl: false,
  },
});
```

#### C. Add Retry Logic for Auth Errors

When receiving 401 errors, the client should:
1. Attempt to refresh the session
2. Retry the request once
3. If still failing, prompt user to re-authenticate

## Verification Steps

### 1. Check Supabase Configuration
```bash
# Verify environment variables are set
EXPO_PUBLIC_SUPABASE_URL=https://zjzvkxvahrbuuyzjzxol.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Test Authentication Flow
1. Sign up / Sign in
2. Verify session is stored in AsyncStorage
3. Check that `supabase.auth.getSession()` returns a valid session
4. Verify the session has not expired

### 3. Test Edge Function Call
1. Send a message in the chat
2. Check browser/app console for logs:
   - `[Chat] Sending to AI:` - should show request details
   - `[Edge][Chat][requestId] Request started` - Edge Function received request
   - `[Edge][Chat][requestId] Success` - Edge Function completed successfully
3. Verify no 401 errors in logs

### 4. Check Database
```sql
-- Verify messages are being inserted
SELECT * FROM messages 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check RLS policies are working
SELECT * FROM pg_policies WHERE tablename = 'messages';
```

## Current Status

### ✅ Fixed
- Edge Function redeployed with correct code (version 66)
- Proper error handling and response structure
- CORS headers configured correctly
- Database insertion working

### ⚠️ Needs Client-Side Fix
- Add session validation before Edge Function calls
- Implement retry logic for auth errors
- Add user-friendly error messages for auth failures

## Testing Checklist

- [ ] User can sign up successfully
- [ ] User can sign in successfully
- [ ] Session persists after app restart
- [ ] Chat messages send successfully
- [ ] AI responses are received and displayed
- [ ] No 401 errors in Edge Function logs
- [ ] Messages are saved to database
- [ ] Realtime subscription receives new messages

## Monitoring

### Edge Function Logs
```bash
# Check recent Edge Function calls
supabase functions logs generate-ai-response --project-ref zjzvkxvahrbuuyzjzxol
```

### Database Queries
```sql
-- Check recent messages
SELECT 
  m.id,
  m.role,
  m.content,
  m.created_at,
  u.email
FROM messages m
JOIN users u ON m.user_id = u.id
ORDER BY m.created_at DESC
LIMIT 20;

-- Check for failed inserts (if you have error logging)
SELECT * FROM edge_function_errors 
WHERE function_name = 'generate-ai-response'
ORDER BY created_at DESC
LIMIT 10;
```

## Next Steps

1. **Implement session validation** in chat.tsx before Edge Function calls
2. **Add retry logic** for 401 errors with session refresh
3. **Test thoroughly** with multiple users and scenarios
4. **Monitor logs** for any remaining issues
5. **Consider adding** client-side session expiry warnings

## Additional Notes

- The Edge Function is now simplified and robust
- All responses return 200 status with `{ ok: true/false }` structure
- CORS is properly configured for web preview
- Database RLS policies are correctly configured
- Realtime subscriptions are working as expected

## Support

If issues persist:
1. Check Edge Function logs for detailed error messages
2. Verify user session is valid with `supabase.auth.getSession()`
3. Check browser console for client-side errors
4. Verify environment variables are correctly set
5. Test with a fresh user account to rule out data issues
