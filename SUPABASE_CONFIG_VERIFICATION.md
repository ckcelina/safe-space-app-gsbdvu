
# Supabase Configuration Verification Guide

## ✅ Configuration Checklist

This guide helps you verify that Safe Space is properly wired to your Supabase project.

### 1. Environment Variables (CLIENT)

The app requires these **CLIENT** environment variables to be set in Natively:

```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

**Important:**
- These MUST start with `EXPO_PUBLIC_` to be available in the Expo client
- These are NOT the same as Edge Function secrets
- These should be in the "Environment Variables" section, NOT "Edge Function Secrets"

### 2. Expected Values

For the Safe Space project:

```
Project Name: Safe Space
Project ID: zjzvkxvahrbuuyzjzxol
URL: https://zjzvkxvahrbuuyzjzxol.supabase.co
```

### 3. Verification Steps

#### Step 1: Check Natively Connection
1. Open your project in Natively
2. Look for "Connect to Project" button
3. Verify "Safe Space" is connected
4. Check that the project ID matches: `zjzvkxvahrbuuyzjzxol`

#### Step 2: Verify Environment Variables
1. In Natively, go to Environment Variables section
2. Confirm both variables are present:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Verify the URL value is: `https://zjzvkxvahrbuuyzjzxol.supabase.co`

#### Step 3: Check Console Logs (DEV Mode)
When the app starts in development mode, you should see:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Supabase] ✅ Configuration validated successfully
[Supabase] 🌐 urlHost=zjzvkxvahrbuuyzjzxol.supabase.co
[Supabase] 🔑 anon=…[last 6 chars]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Supabase] ✅ Client initialized and ready for use
[Supabase] ✅ Auth session persistence: ENABLED
[Supabase] ✅ Auto token refresh: ENABLED
[Supabase] ✅ Session URL detection: ENABLED (web) or DISABLED (native)
```

If you see errors instead, the configuration is not correct.

### 4. Common Issues

#### Issue: "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY"

**Solution:**
- Verify variables are set in Natively's Environment Variables section
- Make sure they start with `EXPO_PUBLIC_`
- Restart the preview completely (stop and start, not just refresh)

#### Issue: "URL must start with https://"

**Solution:**
- Check that the URL value is: `https://zjzvkxvahrbuuyzjzxol.supabase.co`
- Make sure there are no extra spaces or characters

#### Issue: "URL must contain supabase.co"

**Solution:**
- Verify you're using the correct Supabase project URL
- The URL should be: `https://zjzvkxvahrbuuyzjzxol.supabase.co`

#### Issue: Variables set but app still shows configuration screen

**Solution:**
1. Verify the variables are in "Environment Variables" (not Edge Function secrets)
2. Completely stop and restart the preview
3. Check console logs to see what values are being read
4. Make sure you're using the correct variable names with `EXPO_PUBLIC_` prefix

### 5. Testing the Configuration

Once configured correctly, you should be able to:

1. **Sign Up**: Create a new account with email/password
2. **Sign In**: Log in with existing credentials
3. **Send Messages**: Send messages in chat and receive AI responses
4. **Realtime Updates**: See messages update in real-time (on native, polling on web)

### 6. Platform-Specific Behavior

#### Web Preview
- Session detection in URL: **ENABLED**
- Realtime: Uses polling fallback (websockets may be blocked)
- Auth tokens: Persisted in AsyncStorage

#### iOS/Android
- Session detection in URL: **DISABLED**
- Realtime: Uses Supabase Realtime (with polling fallback)
- Auth tokens: Persisted in AsyncStorage

### 7. Security Notes

- The anon key is safe to expose in client code
- It's protected by Row Level Security (RLS) policies
- Never expose the service_role key in client code
- The anon key only allows operations permitted by RLS

### 8. Debugging Commands

If you need to debug the configuration, check these in the console:

```javascript
// Check if Supabase is ready
import { isSupabaseReady, getSupabaseConfig } from '@/lib/supabase';

console.log('Ready:', isSupabaseReady());
console.log('Config:', getSupabaseConfig());
```

### 9. Expected Project Structure

The Safe Space project should have these tables:
- `auth.users` (Supabase Auth)
- `public.users` (user profiles)
- `public.persons` (people user talks about)
- `public.messages` (chat messages)
- `public.memories` (extracted memories)
- `public.ai_preferences` (user AI preferences)

### 10. Edge Functions

The project uses these Edge Functions:
- `generate-ai-response`: Generates AI responses for chat
- `extract-memories`: Extracts memories from conversations

Both functions require the auth session to be present, which is why `persistSession: true` is critical.

## ✅ Acceptance Criteria

Your configuration is correct when:

1. ✅ App no longer shows "Safe Space needs configuration" screen
2. ✅ Console logs show successful Supabase initialization
3. ✅ URL host in logs matches: `zjzvkxvahrbuuyzjzxol.supabase.co`
4. ✅ User can sign up and sign in
5. ✅ Messages can be sent and AI responses are received
6. ✅ No 401/403 errors when calling Edge Functions

## 🆘 Still Having Issues?

If you've followed all steps and still have issues:

1. Check the console logs for specific error messages
2. Verify the Supabase project is active (not paused)
3. Confirm RLS policies are set up correctly
4. Test the Edge Functions directly in Supabase dashboard
5. Check network connectivity (especially on web preview)

## 📝 Notes for Natively Team

This app requires:
- Supabase project connection
- CLIENT environment variables (EXPO_PUBLIC_*)
- Active Supabase project (not paused)
- Edge Functions deployed and accessible
