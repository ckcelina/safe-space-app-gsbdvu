
# Supabase OAuth Setup Guide for Safe Space

This guide will help you set up Google and Apple Sign-In for the Safe Space app using Supabase Auth. The implementation works seamlessly with Expo Go for development and production builds.

## Overview

The OAuth implementation includes:
- ✅ Google Sign-In
- ✅ Apple Sign-In  
- ✅ Expo Go compatibility
- ✅ Deep linking support
- ✅ Automatic user profile creation
- ✅ Session persistence across app restarts

## 1. Enable OAuth Providers in Supabase Dashboard

### Google OAuth Setup

1. **Navigate to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `zjzvkxvahrbuuyzjzxol`
   - Go to Authentication → Providers

2. **Enable Google Provider**
   - Find "Google" in the provider list
   - Toggle it to "Enabled"

3. **Add Google OAuth Credentials**
   - You'll need to create these in Google Cloud Console (see section 3 below)
   - Client ID: From Google Cloud Console
   - Client Secret: From Google Cloud Console

4. **Configure Redirect URLs**
   - The redirect URL is automatically set by Supabase
   - It will be: `https://zjzvkxvahrbuuyzjzxol.supabase.co/auth/v1/callback`

### Apple OAuth Setup

1. **Navigate to Supabase Dashboard**
   - Go to Authentication → Providers
   - Find "Apple" in the provider list

2. **Enable Apple Provider**
   - Toggle it to "Enabled"

3. **Add Apple OAuth Credentials**
   - You'll need to create these in Apple Developer Console (see section 4 below)
   - Services ID: From Apple Developer
   - Team ID: Your Apple Developer Team ID
   - Key ID: From Apple Developer
   - Private Key: Content of your .p8 file

4. **Configure Redirect URLs**
   - The redirect URL is automatically set by Supabase
   - It will be: `https://zjzvkxvahrbuuyzjzxol.supabase.co/auth/v1/callback`

## 2. Configure Redirect URLs in Supabase

The app uses deep linking to handle OAuth callbacks. You need to add the app's redirect URLs to Supabase.

1. **Navigate to URL Configuration**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Find the "Redirect URLs" section

2. **Add the Following URLs:**
   ```
   natively://auth-callback
   exp://127.0.0.1:8081/--/auth-callback
   exp://localhost:8081/--/auth-callback
   ```

3. **For Development on Physical Device:**
   - Find your computer's local IP address
   - Add: `exp://YOUR-LOCAL-IP:8081/--/auth-callback`
   - Example: `exp://192.168.1.100:8081/--/auth-callback`

4. **For Production:**
   - Add your production deep link URL
   - Example: `natively://auth-callback`

**Important Notes:**
- The `natively://` scheme is defined in `app.json` under `scheme: "natively"`
- The `exp://` URLs are for Expo Go development
- Make sure to click "Save" after adding URLs

## 3. Google Cloud Console Setup

Follow these steps to create Google OAuth credentials:

1. **Create/Select a Project**
   - Go to https://console.cloud.google.com
   - Create a new project or select an existing one
   - Name it something like "Safe Space App"

2. **Enable Required APIs**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
   - Also enable "Google Identity Toolkit API"

3. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" user type
   - Fill in required fields:
     - App name: "Safe Space"
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Save and continue

4. **Create OAuth 2.0 Client ID**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "Safe Space Web Client"
   - Add Authorized redirect URIs:
     ```
     https://zjzvkxvahrbuuyzjzxol.supabase.co/auth/v1/callback
     ```
   - Click "Create"

5. **Copy Credentials to Supabase**
   - Copy the "Client ID"
   - Copy the "Client Secret"
   - Go to Supabase Dashboard → Authentication → Providers → Google
   - Paste the Client ID and Client Secret
   - Click "Save"

**Important:** Keep your Client Secret secure and never commit it to version control.

## 4. Apple Developer Setup

Apple Sign-In requires an Apple Developer account ($99/year). Follow these steps:

### Step 1: Create an App ID

1. **Navigate to Identifiers**
   - Go to https://developer.apple.com
   - Sign in with your Apple Developer account
   - Go to "Certificates, Identifiers & Profiles" → "Identifiers"

2. **Create App ID**
   - Click the "+" button to create a new identifier
   - Select "App IDs" and click "Continue"
   - Select "App" and click "Continue"
   - Fill in:
     - Description: "Safe Space App"
     - Bundle ID: `com.anonymous.Natively` (from app.json)
   - Enable "Sign In with Apple"
   - Click "Continue" and "Register"

### Step 2: Create a Services ID

1. **Create Services ID**
   - Go to "Identifiers" → Click "+" button
   - Select "Services IDs" and click "Continue"
   - Fill in:
     - Description: "Safe Space Sign In"
     - Identifier: `com.anonymous.Natively.signin` (must be unique)
   - Click "Continue" and "Register"

2. **Configure Services ID**
   - Click on your newly created Services ID
   - Enable "Sign In with Apple"
   - Click "Configure" next to "Sign In with Apple"
   - Primary App ID: Select your App ID from Step 1
   - Domains and Subdomains: `zjzvkxvahrbuuyzjzxol.supabase.co`
   - Return URLs: `https://zjzvkxvahrbuuyzjzxol.supabase.co/auth/v1/callback`
   - Click "Save" and "Continue"

### Step 3: Create a Key for Sign In with Apple

1. **Create Key**
   - Go to "Keys" → Click "+" button
   - Key Name: "Safe Space Sign In Key"
   - Enable "Sign In with Apple"
   - Click "Configure" next to "Sign In with Apple"
   - Primary App ID: Select your App ID
   - Click "Save" and "Continue"
   - Click "Register"

2. **Download Key**
   - Download the .p8 key file (you can only download it once!)
   - Note the Key ID (10 characters)
   - Keep this file secure

### Step 4: Add Credentials to Supabase

1. **Get Your Team ID**
   - Go to https://developer.apple.com/account
   - Your Team ID is shown in the top right (10 characters)

2. **Configure in Supabase**
   - Go to Supabase Dashboard → Authentication → Providers → Apple
   - Fill in:
     - Services ID: `com.anonymous.Natively.signin` (from Step 2)
     - Team ID: Your 10-character Team ID
     - Key ID: Your 10-character Key ID (from Step 3)
     - Private Key: Open the .p8 file in a text editor and paste the entire content
   - Click "Save"

**Important:** The .p8 private key file can only be downloaded once. Store it securely!

## 5. Testing in Expo Go

Now that everything is configured, test the OAuth flow:

### Development Testing

1. **Start the Expo Dev Server**
   ```bash
   npm run dev
   # or
   npx expo start --tunnel
   ```

2. **Open in Expo Go**
   - Scan the QR code with Expo Go app
   - Navigate to the Login or Signup screen

3. **Test Google Sign-In**
   - Tap "Continue with Google"
   - Browser will open with Google sign-in
   - Select your Google account
   - Grant permissions
   - You'll be redirected back to the app
   - Should see success toast and navigate to home

4. **Test Apple Sign-In**
   - Tap "Continue with Apple"
   - Browser will open with Apple sign-in
   - Sign in with your Apple ID
   - Choose whether to share your email
   - You'll be redirected back to the app
   - Should see success toast and navigate to home

### What Happens Behind the Scenes

1. **OAuth Flow Initiation**
   - App calls `signInWithGoogle()` or `signInWithApple()`
   - Opens browser with Supabase OAuth URL
   - User authenticates with provider

2. **Callback Handling**
   - Provider redirects to Supabase callback URL
   - Supabase processes authentication
   - Redirects to app via deep link: `natively://auth-callback`
   - App extracts tokens from URL

3. **Session Creation**
   - App calls `supabase.auth.setSession()` with tokens
   - Tokens stored in AsyncStorage
   - User profile created in `public.users` table if doesn't exist

4. **Navigation**
   - User redirected to home screen
   - Session persists across app restarts

## 6. Session Persistence

Session persistence is handled automatically:

- **Storage:** Tokens stored in AsyncStorage via Supabase client
- **Auto-refresh:** Access tokens refresh automatically before expiration
- **Persistence:** User stays logged in across app restarts
- **Logout:** Calling `signOut()` clears session from AsyncStorage

The `AuthContext` monitors session state and updates the UI accordingly.

## 7. User Profile Creation

When a user signs in with OAuth for the first time:

1. **Auth User Created:** Supabase creates user in `auth.users` table
2. **Profile Check:** App checks if profile exists in `public.users` table
3. **Profile Creation:** If missing, app creates profile with:
   - `user_id`: From auth.users
   - `email`: From OAuth provider
   - `role`: Set to 'free'
4. **Error Handling:** If profile creation fails, user can still use app

This ensures OAuth users have the same data structure as email/password users.

## 8. Production Deployment

For production builds:

1. **Update Redirect URLs**
   - Add production deep link URL to Supabase
   - Example: `natively://auth-callback`
   - Or custom domain: `https://app.safespace.com/auth-callback`

2. **Update OAuth Providers**
   - Add production redirect URLs to Google Cloud Console
   - Add production redirect URLs to Apple Developer

3. **Test on Physical Devices**
   - Build production app with EAS Build
   - Test OAuth flow on iOS and Android
   - Verify deep linking works correctly

## Troubleshooting

### OAuth redirect doesn't work

**Symptoms:** Browser opens but doesn't redirect back to app

**Solutions:**
- Check redirect URLs match exactly in Supabase (case-sensitive)
- Ensure `scheme: "natively"` is in app.json
- Try restarting Expo dev server
- Clear Expo Go cache: Settings → Clear cache

### "Invalid redirect URL" error

**Symptoms:** Error message when trying to sign in

**Solutions:**
- Add all possible redirect URLs to Supabase dashboard
- Include both `natively://` and `exp://` schemes
- Make sure URLs don't have trailing slashes
- Wait a few minutes after saving URLs (Supabase may need to propagate)

### Session not persisting

**Symptoms:** User logged out after closing app

**Solutions:**
- Check AsyncStorage permissions in app
- Verify Supabase client initialization includes AsyncStorage
- Check for errors in console logs
- Try clearing app data and signing in again

### Google Sign-In shows "Access Blocked"

**Symptoms:** Google shows "This app is blocked" error

**Solutions:**
- Complete OAuth consent screen configuration
- Add test users in Google Cloud Console
- Verify app is in "Testing" or "Production" mode
- Check authorized redirect URIs are correct

### Apple Sign-In doesn't work

**Symptoms:** Apple sign-in fails or shows error

**Solutions:**
- Verify Services ID is correctly configured
- Check return URLs match exactly
- Ensure .p8 private key is pasted correctly (including BEGIN/END lines)
- Verify Team ID and Key ID are correct
- Make sure App ID has "Sign In with Apple" enabled

### User profile not created

**Symptoms:** User can sign in but has no profile data

**Solutions:**
- Check `public.users` table exists
- Verify RLS policies allow inserts
- Check console logs for profile creation errors
- Profile creation is non-blocking, so user can still use app

## Security Notes

1. **Never commit credentials:** Keep Client Secrets and Private Keys out of version control
2. **Use environment variables:** Store sensitive data in `.env` files (not committed)
3. **Rotate keys regularly:** Change OAuth credentials periodically
4. **Monitor usage:** Check Supabase dashboard for suspicious activity
5. **Enable RLS:** Ensure Row Level Security is enabled on all tables

## Support

If you encounter issues not covered here:

1. Check Supabase logs: Dashboard → Logs
2. Check app console logs for errors
3. Review Supabase Auth documentation: https://supabase.com/docs/guides/auth
4. Contact support with specific error messages

## Summary

✅ **What's Implemented:**
- Google Sign-In on login and signup screens
- Apple Sign-In on login and signup screens
- Expo Go compatibility with deep linking
- Automatic user profile creation
- Session persistence across app restarts
- Error handling and user feedback

✅ **What You Need to Do:**
1. Enable Google and Apple providers in Supabase Dashboard
2. Create OAuth credentials in Google Cloud Console
3. Create OAuth credentials in Apple Developer
4. Add redirect URLs to Supabase
5. Test in Expo Go

Once configured, users can sign in with Google or Apple with a single tap!

---

## Quick Start Checklist

Use this checklist to quickly set up OAuth:

### Supabase Configuration
- [ ] Enable Google provider in Supabase Dashboard
- [ ] Add Google Client ID and Secret
- [ ] Enable Apple provider in Supabase Dashboard  
- [ ] Add Apple Services ID, Team ID, Key ID, and Private Key
- [ ] Add redirect URLs: `natively://auth-callback`, `exp://127.0.0.1:8081/--/auth-callback`

### Google Cloud Console
- [ ] Create project in Google Cloud Console
- [ ] Enable Google+ API and Google Identity Toolkit API
- [ ] Configure OAuth consent screen
- [ ] Create OAuth 2.0 Client ID (Web application)
- [ ] Add redirect URI: `https://zjzvkxvahrbuuyzjzxol.supabase.co/auth/v1/callback`
- [ ] Copy Client ID and Secret to Supabase

### Apple Developer
- [ ] Create App ID with Sign In with Apple enabled
- [ ] Create Services ID
- [ ] Configure Services ID with domain and return URL
- [ ] Create Key for Sign In with Apple
- [ ] Download .p8 key file (only available once!)
- [ ] Copy Services ID, Team ID, Key ID, and Private Key to Supabase

### Testing
- [ ] Start Expo dev server: `npm run dev`
- [ ] Open app in Expo Go
- [ ] Test Google Sign-In from login screen
- [ ] Test Apple Sign-In from login screen
- [ ] Test Google Sign-In from signup screen
- [ ] Test Apple Sign-In from signup screen
- [ ] Verify user profile created in `public.users` table
- [ ] Close and reopen app - verify session persists
- [ ] Test sign out and sign in again

### Verification
- [ ] Check Supabase Dashboard → Authentication → Users for new OAuth users
- [ ] Check `public.users` table for user profiles
- [ ] Verify no errors in console logs
- [ ] Test on both iOS and Android (if possible)

---

## File Structure

The OAuth implementation consists of these files:

```
lib/auth/
  └── supabaseOAuth.ts          # OAuth flow functions

app/
  ├── login.tsx                  # Login screen with OAuth buttons
  ├── signup.tsx                 # Signup screen with OAuth buttons
  └── auth-callback.tsx          # OAuth callback handler

contexts/
  └── AuthContext.tsx            # Auth state management

app.json                         # Deep linking configuration (scheme: "natively")
```

## Code Flow

```
User taps "Continue with Google"
  ↓
signInWithGoogle() called
  ↓
Opens browser with Supabase OAuth URL
  ↓
User authenticates with Google
  ↓
Google redirects to Supabase callback
  ↓
Supabase processes auth and redirects to app
  ↓
Deep link: natively://auth-callback?access_token=...
  ↓
AuthCallback component extracts tokens
  ↓
Sets session with supabase.auth.setSession()
  ↓
Creates user profile in public.users if needed
  ↓
Navigates to home screen
  ↓
User is signed in!
```
