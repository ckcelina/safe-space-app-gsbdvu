
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';

// Ensure WebBrowser is properly configured for auth sessions
WebBrowser.maybeCompleteAuthSession();

/**
 * Determines if we're running in Expo Go
 */
const isExpoGo = () => {
  return Constants.appOwnership === 'expo';
};

/**
 * Generates the appropriate redirect URI based on the environment
 * - Expo Go (dev): Uses proxy redirect
 * - TestFlight/Production: Uses custom scheme
 */
const getRedirectUri = (): string => {
  const useProxy = __DEV__ && isExpoGo();
  
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'safespace',
    useProxy,
  });
  
  console.debug('[OAuth] Generated redirect URI:', redirectUri);
  console.debug('[OAuth] Environment:', {
    isDev: __DEV__,
    isExpoGo: isExpoGo(),
    useProxy,
    platform: Platform.OS,
  });
  
  return redirectUri;
};

/**
 * Initiates Google OAuth sign-in flow
 * Works in both Expo Go (development) and TestFlight (production)
 */
export const signInWithGoogle = async (): Promise<void> => {
  try {
    console.debug('[OAuth] Starting Google sign-in flow...');
    
    // Generate redirect URI
    const redirectTo = getRedirectUri();
    
    // Initiate OAuth flow with Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true, // We'll handle the browser ourselves
      },
    });

    if (error) {
      console.debug('[OAuth] Supabase OAuth error:', error.message);
      Alert.alert(
        'Sign In Error',
        'Unable to start Google sign-in. Please try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!data?.url) {
      console.debug('[OAuth] No OAuth URL returned from Supabase');
      Alert.alert(
        'Sign In Error',
        'Unable to start Google sign-in. Please try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    console.debug('[OAuth] Opening OAuth URL in browser...');
    
    // Open the OAuth URL in a web browser
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo
    );

    console.debug('[OAuth] Browser result:', result.type);

    if (result.type === 'success') {
      // The URL contains the OAuth tokens
      const url = result.url;
      console.debug('[OAuth] OAuth flow completed successfully');
      
      // Extract the session from the URL
      // Supabase will automatically handle the session via onAuthStateChange
      // But we can also manually set it if needed
      if (url) {
        const params = new URL(url).searchParams;
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken && refreshToken) {
          console.debug('[OAuth] Setting session from tokens...');
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (sessionError) {
            console.debug('[OAuth] Error setting session:', sessionError.message);
          }
        }
      }
      
      // Refresh the session to ensure everything is up to date
      await supabase.auth.getSession();
      
      // The AuthProvider will handle navigation via onAuthStateChange
      console.debug('[OAuth] Sign-in complete, waiting for auth state change...');
      
    } else if (result.type === 'cancel') {
      console.debug('[OAuth] User cancelled the sign-in flow');
      // Don't show an error for user cancellation
    } else {
      console.debug('[OAuth] Unexpected browser result:', result.type);
      Alert.alert(
        'Sign In Cancelled',
        'Google sign-in was not completed.',
        [{ text: 'OK' }]
      );
    }
    
  } catch (error: any) {
    console.debug('[OAuth] Unexpected error during Google sign-in:', error.message);
    Alert.alert(
      'Sign In Error',
      'An unexpected error occurred. Please try again.',
      [{ text: 'OK' }]
    );
  }
};
