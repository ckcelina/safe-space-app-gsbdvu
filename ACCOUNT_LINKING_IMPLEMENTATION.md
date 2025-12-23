
# Account Linking Implementation Summary

## Overview
This implementation adds account linking functionality to the Safe Space app, allowing users to connect multiple login methods (Google, Apple, Email) to a single Supabase user account.

## What Was Implemented

### 1. New Helper File: `lib/auth/linking.ts`
Created a comprehensive helper module with the following functions:

- **`linkGoogleIdentity()`**: Links a Google account to the currently logged-in user using OAuth browser flow
- **`linkAppleIdentity()`**: Links an Apple account using native Apple Sign-In (iOS only)
- **`getUserIdentities()`**: Retrieves all identities linked to the current user
- **`unlinkIdentity(identityId)`**: Unlinks a specific identity (requires at least 2 identities)

### 2. Updated Settings Screen: `app/(tabs)/settings.tsx`
Added a new "Connected accounts" section that displays:

- **Currently Connected Providers**: Shows all linked accounts (Google, Apple, Email) with:
  - Provider icon and name
  - Associated email address (if available)
  - "Unlink" button (only shown if user has 2+ identities)

- **Link Account Buttons**:
  - "Link Google" button (shown if Google not already linked)
  - "Link Apple" button (iOS only, shown if Apple not already linked)

- **Loading States**: Shows loading indicators while fetching identities or linking accounts

## How It Works

### Account Linking Flow

1. **User is logged in** with any method (Email, Google, or Apple)
2. **User navigates to Settings** and sees "Connected accounts" section
3. **User clicks "Link Google" or "Link Apple"**
4. **OAuth/Native flow initiates**:
   - Google: Opens browser with OAuth flow
   - Apple: Uses native Apple Sign-In
5. **Identity is linked** to the existing user account
6. **Session is refreshed** to reflect the new identity
7. **UI updates** to show the newly linked account

### Data Consistency

All app data tables already use `auth.uid()` for `user_id`, which means:
- Data is tied to the Supabase user ID, not the login method
- When a user links a new provider, they can log in with any linked method and access the same data
- No data migration is needed

### Security & Error Handling

- **Minimum Identity Requirement**: Users must have at least 2 identities to unlink one (prevents account lockout)
- **User-Friendly Errors**: All errors are displayed as toasts, not red LogBox screens
- **Graceful Cancellation**: User cancellation of linking flows is handled silently
- **Session Refresh**: After linking/unlinking, the session is refreshed to ensure up-to-date identity information

## User Experience

### Linking an Account
1. User sees "Link Google" or "Link Apple" button in Settings
2. Clicks the button
3. Completes OAuth/Apple Sign-In flow
4. Returns to app with success message
5. Linked account now appears in "Connected accounts" list

### Unlinking an Account
1. User sees "Unlink" button next to each linked account (if they have 2+ accounts)
2. Clicks "Unlink"
3. Confirms in alert dialog
4. Account is unlinked with success message
5. Account disappears from "Connected accounts" list

### Logging In with Linked Accounts
- User can log in with any linked method (Google, Apple, or Email)
- All login methods access the same user account and data
- No data duplication or conflicts

## Technical Details

### Supabase Identity Linking
- Uses Supabase Auth v2 `linkIdentity()` method
- Supports both OAuth providers (Google) and native providers (Apple)
- Identities are stored in `auth.identities` table
- User object contains `identities` array with all linked providers

### OAuth Flow (Google)
- Uses `expo-auth-session` for redirect URI generation
- Uses `expo-web-browser` for OAuth browser flow
- Supports both Expo Go (proxy) and TestFlight (custom scheme)
- Reuses existing OAuth helper logic from `lib/auth/oauth.ts`

### Native Flow (Apple)
- Uses `expo-apple-authentication` for native Apple Sign-In
- iOS only (button hidden on Android)
- Uses identity token for linking
- Reuses existing Apple helper logic from `lib/auth/apple.ts`

## Configuration Requirements

### Supabase Dashboard
Manual linking must be enabled in Supabase Auth settings:
1. Go to Authentication → Settings
2. Enable "Manual Linking" under "Identity Linking"

### OAuth Providers
Google and Apple OAuth must already be configured (already done in previous steps):
- Google OAuth client ID and secret
- Apple Service ID and Bundle Identifier
- Redirect URLs configured

## Testing Checklist

- [ ] User can link Google account while logged in with Email
- [ ] User can link Apple account while logged in with Email (iOS only)
- [ ] User can link Email account while logged in with Google
- [ ] User can log in with any linked method and access same data
- [ ] User cannot unlink their only identity
- [ ] User can unlink an identity when they have 2+ identities
- [ ] Linking errors are displayed as user-friendly toasts
- [ ] User cancellation of linking flows doesn't show errors
- [ ] Connected accounts list updates after linking/unlinking
- [ ] Loading states are shown during linking operations

## Known Limitations

1. **Email Linking**: Currently, users cannot link a new email/password identity from the Settings screen. They can only link OAuth providers (Google, Apple). To add email/password to an OAuth account, users can use the "Change password" feature which will add a password to their account.

2. **Provider Conflicts**: If a user tries to link a Google/Apple account that's already associated with a different Supabase user, the linking will fail with an error message.

3. **iOS Only for Apple**: Apple Sign-In is only available on iOS devices. The "Link Apple" button is hidden on Android.

## Future Enhancements

1. **Email Linking**: Add ability to link a new email/password identity
2. **Identity Management**: Show more details about each identity (creation date, last used, etc.)
3. **Primary Identity**: Allow users to set a "primary" login method
4. **Automatic Linking**: Enable automatic linking for accounts with the same verified email
5. **Unlink Confirmation**: Add more detailed confirmation dialog with warnings

## Files Modified

- **Created**: `lib/auth/linking.ts` - Account linking helper functions
- **Modified**: `app/(tabs)/settings.tsx` - Added "Connected accounts" section

## Dependencies Used

- `@supabase/supabase-js` - Supabase client with `linkIdentity()` and `unlinkIdentity()` methods
- `expo-auth-session` - OAuth redirect URI generation
- `expo-web-browser` - OAuth browser flow
- `expo-apple-authentication` - Native Apple Sign-In
- Existing auth helpers: `lib/auth/oauth.ts`, `lib/auth/apple.ts`
