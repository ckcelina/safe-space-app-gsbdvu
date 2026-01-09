
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

/**
 * OAuth callback handler for deep linking
 */
export default function AuthCallback() {
  const params = useLocalSearchParams();

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    try {
      console.log('[AuthCallback] Processing OAuth callback...');
      const { access_token, refresh_token } = params;

      if (access_token && refresh_token) {
        // Set the session
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: access_token as string,
          refresh_token: refresh_token as string,
        });

        if (sessionError) {
          console.error('[AuthCallback] Session error:', sessionError);
          throw sessionError;
        }

        if (sessionData?.user) {
          console.log('[AuthCallback] Session established for user:', sessionData.user.id);

          // Check if user profile exists in public.users
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', sessionData.user.id)
            .maybeSingle();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('[AuthCallback] Error checking user profile:', fetchError);
          }

          // Create user profile if it doesn't exist
          if (!existingUser) {
            console.log('[AuthCallback] Creating user profile for OAuth user...');
            const { error: insertError } = await supabase
              .from('users')
              .insert([{
                user_id: sessionData.user.id,
                email: sessionData.user.email,
                role: 'free',
              }]);

            if (insertError) {
              // Log but don't block - user can still use the app
              console.warn('[AuthCallback] Failed to create user profile:', insertError);
            } else {
              console.log('[AuthCallback] User profile created successfully');
            }
          } else {
            console.log('[AuthCallback] User profile already exists');
          }
        }
        
        // Navigate to home
        console.log('[AuthCallback] Redirecting to home...');
        router.replace('/(tabs)/(home)');
      } else {
        console.log('[AuthCallback] Missing tokens, redirecting to login');
        router.replace('/login');
      }
    } catch (error) {
      console.error('[AuthCallback] Auth callback error:', error);
      router.replace('/login');
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
