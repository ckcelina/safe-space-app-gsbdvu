
import { SafeSpaceTextInput } from '@/components/ui/SafeSpaceTextInput';
import { showErrorToast } from '@/utils/toast';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithGoogle, signInWithApple } from '@/lib/auth/supabaseOAuth';
import { SafeSpaceTitle, SafeSpaceCaption } from '@/components/ui/SafeSpaceText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { supabase } from '@/lib/supabase';
import { useThemeContext } from '@/contexts/ThemeContext';
import { SafeSpaceLinkButton } from '@/components/ui/SafeSpaceLinkButton';
import React, { useState } from 'react';
import { SafeSpaceButton } from '@/components/ui/SafeSpaceButton';
import { Ionicons } from '@expo/vector-icons';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 48,
    alignItems: 'center',
  },
  form: {
    marginBottom: 24,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.2,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    opacity: 0.6,
  },
  socialButtons: {
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    marginRight: 4,
  },
});

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const { theme } = useThemeContext();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showErrorToast('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      console.log('[Login] Attempting login with email:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        console.error('[Login] Supabase auth error:', error);
        showErrorToast(error.message || 'Login failed');
        return;
      }

      if (!data.user) {
        console.error('[Login] No user returned from Supabase');
        showErrorToast('Login failed - no user data');
        return;
      }

      console.log('[Login] Login successful, user:', data.user.id);

      // Check if user profile exists in public.users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('[Login] Error fetching user profile:', userError);
      }

      if (!userData) {
        console.log('[Login] No user profile found, creating one');
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            user_id: data.user.id,
            role: 'free',
          });

        if (insertError) {
          console.error('[Login] Error creating user profile:', insertError);
          // Don't block login if profile creation fails
        }
      }

      // Navigate to home
      router.replace('/(tabs)/(home)');
    } catch (error: any) {
      console.error('[Login] Unexpected error:', error);
      showErrorToast(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('[Login] Google sign-in error:', error);
      showErrorToast(error.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      await signInWithApple();
    } catch (error: any) {
      console.error('[Login] Apple sign-in error:', error);
      showErrorToast(error.message || 'Apple sign-in failed');
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[theme.background, theme.background]}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoider>
          <View style={styles.content}>
            <View style={styles.header}>
              <SafeSpaceTitle>Welcome Back</SafeSpaceTitle>
              <SafeSpaceCaption>Sign in to continue</SafeSpaceCaption>
            </View>

            <View style={styles.form}>
              {/* Email Input with iOS AutoFill Support */}
              <SafeSpaceTextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                autoComplete="email"
                editable={!loading}
              />

              {/* Password Input with iOS AutoFill Support */}
              <SafeSpaceTextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                autoComplete="password"
                editable={!loading}
              />

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => router.push('/forgot-password')}
                disabled={loading}
              >
                <Text style={[styles.footerText, { color: theme.primary }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              <SafeSpaceButton
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                disabled={loading || googleLoading || appleLoading}
              />
            </View>

            {/* Social Sign In Options */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.textPrimary }]} />
              <Text style={[styles.dividerText, { color: theme.textPrimary }]}>
                or continue with
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.textPrimary }]} />
            </View>

            <View style={styles.socialButtons}>
              {/* Google Sign In */}
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.textSecondary + '40',
                  },
                ]}
                onPress={handleGoogleSignIn}
                disabled={loading || googleLoading || appleLoading}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color={theme.textPrimary} />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={20} color={theme.textPrimary} />
                    <Text style={[styles.socialButtonText, { color: theme.textPrimary }]}>
                      Continue with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Apple Sign In (iOS only) */}
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[
                    styles.socialButton,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.textSecondary + '40',
                    },
                  ]}
                  onPress={handleAppleSignIn}
                  disabled={loading || googleLoading || appleLoading}
                >
                  {appleLoading ? (
                    <ActivityIndicator size="small" color={theme.textPrimary} />
                  ) : (
                    <>
                      <Ionicons name="logo-apple" size={20} color={theme.textPrimary} />
                      <Text style={[styles.socialButtonText, { color: theme.textPrimary }]}>
                        Continue with Apple
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                Don&apos;t have an account?
              </Text>
              <SafeSpaceLinkButton
                title="Sign Up"
                onPress={() => router.push('/signup')}
                disabled={loading || googleLoading || appleLoading}
              />
            </View>
          </View>
        </KeyboardAvoider>
      </SafeAreaView>
    </LinearGradient>
  );
}
