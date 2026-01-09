
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

/**
 * Sign in with Google using Supabase OAuth
 */
export async function signInWithGoogle() {
  try {
    const redirectUrl = makeRedirectUri({
      scheme: 'natively',
      path: 'auth/callback',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: Platform.OS !== 'web',
      },
    });

    if (error) throw error;

    if (Platform.OS !== 'web' && data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      
      if (result.type === 'success') {
        const url = result.url;
        const params = Linking.parse(url);
        
        // Extract tokens from URL
        if (params.queryParams?.access_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.queryParams.access_token as string,
            refresh_token: params.queryParams.refresh_token as string,
          });
          
          if (sessionError) throw sessionError;
          return { success: true };
        }
      }
    }

    return { success: Platform.OS === 'web' };
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
}

/**
 * Sign in with Apple using Supabase OAuth
 */
export async function signInWithApple() {
  try {
    const redirectUrl = makeRedirectUri({
      scheme: 'natively',
      path: 'auth/callback',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: Platform.OS !== 'web',
      },
    });

    if (error) throw error;

    if (Platform.OS !== 'web' && data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      
      if (result.type === 'success') {
        const url = result.url;
        const params = Linking.parse(url);
        
        if (params.queryParams?.access_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.queryParams.access_token as string,
            refresh_token: params.queryParams.refresh_token as string,
          });
          
          if (sessionError) throw sessionError;
          return { success: true };
        }
      }
    }

    return { success: Platform.OS === 'web' };
  } catch (error) {
    console.error('Apple sign in error:', error);
    throw error;
  }
}
