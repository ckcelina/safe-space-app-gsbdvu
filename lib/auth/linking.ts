
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
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
 */
const getRedirectUri = (): string => {
  const useProxy = __DEV__ && isExpoGo();
  
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'safespace',
    useProxy,
  });
  
  console.debug('[Linking] Generated redirect URI:', redirectUri);
  
  return redirectUri;
};

/**
 * Links a Google account to the currently logged-in user
 */
export const linkGoogleIdentity = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.debug('[Linking] Starting Google identity linking...');
    
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.debug('[Linking] No active session found');
      return { success: false, error: 'You must be logged in to link accounts' };
    }
    
    // Generate redirect URI
    const redirectTo = getRedirectUri();
    
    // Initiate OAuth linking flow with Supabase
    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.debug('[Linking] Supabase linkIdentity error:', error.message);
      return { success: false, error: error.message };
    }

    if (!data?.url) {
      console.debug('[Linking] No OAuth URL returned from Supabase');
      return { success: false, error: 'Unable to start Google linking' };
    }

    console.debug('[Linking] Opening OAuth URL in browser...');
    
    // Open the OAuth URL in a web browser
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo
    );

    console.debug('[Linking] Browser result:', result.type);

    if (result.type === 'success') {
      console.debug('[Linking] Google identity linked successfully');
      
      // Refresh the session to get updated identities
      await supabase.auth.refreshSession();
      
      return { success: true };
    } else if (result.type === 'cancel') {
      console.debug('[Linking] User cancelled the linking flow');
      return { success: false, error: 'Linking cancelled' };
    } else {
      console.debug('[Linking] Unexpected browser result:', result.type);
      return { success: false, error: 'Linking was not completed' };
    }
    
  } catch (error: any) {
    console.debug('[Linking] Unexpected error during Google linking:', error.message);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Links an Apple account to the currently logged-in user
 */
export const linkAppleIdentity = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.debug('[Linking] Starting Apple identity linking...');
    
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.debug('[Linking] No active session found');
      return { success: false, error: 'You must be logged in to link accounts' };
    }
    
    // Check if Apple Sign-In is available
    if (Platform.OS !== 'ios') {
      return { success: false, error: 'Apple Sign-In is only available on iOS' };
    }
    
    // Request Apple credentials
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    console.debug('[Linking] Apple credential received');

    if (!credential?.identityToken) {
      console.debug('[Linking] No identity token received from Apple');
      return { success: false, error: 'Unable to complete Apple linking' };
    }

    console.debug('[Linking] Linking Apple identity with Supabase...');

    // Link the Apple identity using the identity token
    const { error } = await supabase.auth.linkIdentity({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) {
      console.debug('[Linking] Supabase linkIdentity error:', error.message);
      return { success: false, error: error.message };
    }

    console.debug('[Linking] Apple identity linked successfully');
    
    // Refresh the session to get updated identities
    await supabase.auth.refreshSession();
    
    return { success: true };
    
  } catch (error: any) {
    // Handle user cancellation gracefully
    if (error.code === 'ERR_REQUEST_CANCELED') {
      console.debug('[Linking] User cancelled the linking flow');
      return { success: false, error: 'Linking cancelled' };
    }

    console.debug('[Linking] Unexpected error during Apple linking:', error.message || error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Gets all identities linked to the current user
 */
export const getUserIdentities = async (): Promise<{
  identities: {
    id: string;
    provider: string;
    email?: string;
    created_at: string;
  }[];
  error?: string;
}> => {
  try {
    console.debug('[Linking] Fetching user identities...');
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.debug('[Linking] Error fetching user:', error.message);
      return { identities: [], error: error.message };
    }
    
    if (!user) {
      console.debug('[Linking] No user found');
      return { identities: [], error: 'No user found' };
    }
    
    // Extract identities from user object
    const identities = user.identities?.map((identity: any) => ({
      id: identity.id,
      provider: identity.provider,
      email: identity.identity_data?.email,
      created_at: identity.created_at,
    })) || [];
    
    console.debug('[Linking] Found identities:', identities.length);
    
    return { identities };
    
  } catch (error: any) {
    console.debug('[Linking] Unexpected error fetching identities:', error.message);
    return { identities: [], error: 'An unexpected error occurred' };
  }
};

/**
 * Unlinks an identity from the current user
 * Note: User must have at least 2 identities to unlink one
 */
export const unlinkIdentity = async (identityId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.debug('[Linking] Unlinking identity:', identityId);
    
    // Get current identities
    const { identities, error: fetchError } = await getUserIdentities();
    
    if (fetchError) {
      return { success: false, error: fetchError };
    }
    
    // Check if user has at least 2 identities
    if (identities.length < 2) {
      return { success: false, error: 'You must have at least one other login method before unlinking' };
    }
    
    // Find the identity to unlink
    const identity = identities.find(i => i.id === identityId);
    if (!identity) {
      return { success: false, error: 'Identity not found' };
    }
    
    // Unlink the identity
    const { error } = await supabase.auth.unlinkIdentity(identity);
    
    if (error) {
      console.debug('[Linking] Error unlinking identity:', error.message);
      return { success: false, error: error.message };
    }
    
    console.debug('[Linking] Identity unlinked successfully');
    
    // Refresh the session
    await supabase.auth.refreshSession();
    
    return { success: true };
    
  } catch (error: any) {
    console.debug('[Linking] Unexpected error unlinking identity:', error.message);
    return { success: false, error: 'An unexpected error occurred' };
  }
};
