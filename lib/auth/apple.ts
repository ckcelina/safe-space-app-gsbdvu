
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

/**
 * Initiates native Apple Sign-In flow and authenticates with Supabase
 * Uses expo-apple-authentication for native iOS sign-in (NOT OAuth browser)
 * 
 * @returns Promise<void>
 */
export async function signInWithApple(): Promise<void> {
  try {
    console.debug('[Apple Auth] Starting Apple sign-in flow...');
    
    // Request Apple credentials with full name and email scopes
    // Note: Apple may only return email on the first sign-in
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    console.debug('[Apple Auth] Apple credential received');
    console.debug('[Apple Auth] Has identity token:', !!credential.identityToken);
    console.debug('[Apple Auth] Has email:', !!credential.email);

    // Verify we received an identity token
    if (!credential?.identityToken) {
      console.debug('[Apple Auth] No identity token received from Apple');
      Alert.alert(
        'Sign In Error',
        'Unable to complete Apple sign-in. Please try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    console.debug('[Apple Auth] Authenticating with Supabase...');

    // Authenticate with Supabase using the Apple identity token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) {
      console.debug('[Apple Auth] Supabase authentication error:', error.message);
      Alert.alert(
        'Sign In Error',
        error.message || 'Unable to complete Apple sign-in. Please try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    console.debug('[Apple Auth] Successfully authenticated with Supabase');
    console.debug('[Apple Auth] User:', data.user?.email || 'No email');
    
    // The AuthProvider will handle navigation via onAuthStateChange
    console.debug('[Apple Auth] Sign-in complete, waiting for auth state change...');
    
  } catch (error: any) {
    // Handle user cancellation gracefully (don't show error)
    if (error.code === 'ERR_REQUEST_CANCELED') {
      console.debug('[Apple Auth] User cancelled the sign-in flow');
      return;
    }

    // Handle other errors
    console.debug('[Apple Auth] Unexpected error during Apple sign-in:', error.message || error);
    Alert.alert(
      'Sign In Error',
      'An unexpected error occurred. Please try again.',
      [{ text: 'OK' }]
    );
  }
}

/**
 * Checks if Apple Sign-In is available on the current platform
 * Apple Sign-In is only available on iOS devices (not simulators in some cases)
 * 
 * @returns boolean - true if Apple Sign-In is available
 */
export function isAppleSignInAvailable(): boolean {
  // Apple Sign-In is only available on iOS
  if (Platform.OS !== 'ios') {
    return false;
  }

  // On iOS, we can use AppleAuthentication.isAvailableAsync() for more precise checking
  // but for simplicity, we'll just check the platform
  // You can enhance this with: await AppleAuthentication.isAvailableAsync()
  return true;
}
