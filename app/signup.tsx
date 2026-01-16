
import { SafeSpaceTextInput } from '@/components/ui/SafeSpaceTextInput';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { signInWithGoogle, signInWithApple, signInWithGitHub } from '@/lib/auth/supabaseOAuth';
import { SafeSpaceTitle, SafeSpaceCaption } from '@/components/ui/SafeSpaceText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { SafeSpaceLinkButton } from '@/components/ui/SafeSpaceLinkButton';
import React, { useState } from 'react';
import { SafeSpaceButton } from '@/components/ui/SafeSpaceButton';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  form: {
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    textDecorationLine: 'underline',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
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
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    marginRight: 4,
  },
});

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGitHubLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const { signUp } = useAuth();
  const { theme } = useThemeContext();

  const handleSignup = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      showErrorToast('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      showErrorToast('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showErrorToast('Password must be at least 6 characters');
      return;
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      showErrorToast('Please accept the Terms and Privacy Policy');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
      showSuccessToast('Account created successfully!');
      router.replace('/onboarding');
    } catch (error: any) {
      console.error('[Signup] Error:', error);
      showErrorToast(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!acceptedTerms || !acceptedPrivacy) {
      showErrorToast('Please accept the Terms and Privacy Policy');
      return;
    }

    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.replace('/onboarding');
    } catch (error: any) {
      console.error('[Signup] Google sign-in error:', error);
      showErrorToast(error.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    if (!acceptedTerms || !acceptedPrivacy) {
      showErrorToast('Please accept the Terms and Privacy Policy');
      return;
    }

    setGitHubLoading(true);
    try {
      await signInWithGitHub();
      router.replace('/onboarding');
    } catch (error: any) {
      console.error('[Signup] GitHub sign-in error:', error);
      showErrorToast(error.message || 'GitHub sign-in failed');
    } finally {
      setGitHubLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (!acceptedTerms || !acceptedPrivacy) {
      showErrorToast('Please accept the Terms and Privacy Policy');
      return;
    }

    setAppleLoading(true);
    try {
      await signInWithApple();
      router.replace('/onboarding');
    } catch (error: any) {
      console.error('[Signup] Apple sign-in error:', error);
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <SafeSpaceTitle>Create Account</SafeSpaceTitle>
              <SafeSpaceCaption>Join Safe Space today</SafeSpaceCaption>
            </View>

            <View style={styles.form}>
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

              <SafeSpaceTextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="newPassword"
                autoComplete="new-password"
                editable={!loading}
              />

              <SafeSpaceTextInput
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                textContentType="newPassword"
                autoComplete="new-password"
                editable={!loading}
              />

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                disabled={loading}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: acceptedTerms ? theme.primary : theme.textSecondary,
                      backgroundColor: acceptedTerms ? theme.primary : 'transparent',
                    },
                  ]}
                >
                  {acceptedTerms && (
                    <Ionicons name="checkmark" size={14} color={theme.buttonText} />
                  )}
                </View>
                <Text style={[styles.checkboxText, { color: theme.textPrimary }]}>
                  I accept the{' '}
                  <Text
                    style={[styles.link, { color: theme.primary }]}
                    onPress={() => router.push('/legal/terms-of-service')}
                  >
                    Terms of Service
                  </Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
                disabled={loading}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: acceptedPrivacy ? theme.primary : theme.textSecondary,
                      backgroundColor: acceptedPrivacy ? theme.primary : 'transparent',
                    },
                  ]}
                >
                  {acceptedPrivacy && (
                    <Ionicons name="checkmark" size={14} color={theme.buttonText} />
                  )}
                </View>
                <Text style={[styles.checkboxText, { color: theme.textPrimary }]}>
                  I accept the{' '}
                  <Text
                    style={[styles.link, { color: theme.primary }]}
                    onPress={() => router.push('/legal/privacy-policy')}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </TouchableOpacity>

              <SafeSpaceButton
                title="Create Account"
                onPress={handleSignup}
                loading={loading}
                disabled={loading || googleLoading || githubLoading || appleLoading}
              />
            </View>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.textPrimary }]} />
              <Text style={[styles.dividerText, { color: theme.textPrimary }]}>
                or continue with
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.textPrimary }]} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.textSecondary + '40',
                  },
                ]}
                onPress={handleGoogleSignIn}
                disabled={loading || googleLoading || githubLoading || appleLoading}
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

              <TouchableOpacity
                style={[
                  styles.socialButton,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.textSecondary + '40',
                  },
                ]}
                onPress={handleGitHubSignIn}
                disabled={loading || googleLoading || githubLoading || appleLoading}
              >
                {githubLoading ? (
                  <ActivityIndicator size="small" color={theme.textPrimary} />
                ) : (
                  <>
                    <Ionicons name="logo-github" size={20} color={theme.textPrimary} />
                    <Text style={[styles.socialButtonText, { color: theme.textPrimary }]}>
                      Continue with GitHub
                    </Text>
                  </>
                )}
              </TouchableOpacity>

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
                  disabled={loading || googleLoading || githubLoading || appleLoading}
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
                Already have an account?
              </Text>
              <SafeSpaceLinkButton
                title="Sign In"
                onPress={() => router.push('/login')}
                disabled={loading || googleLoading || appleLoading}
              />
            </View>
          </ScrollView>
        </KeyboardAvoider>
      </SafeAreaView>
    </LinearGradient>
  );
}
