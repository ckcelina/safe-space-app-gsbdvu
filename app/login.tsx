
import { SafeSpaceTextInput } from '@/components/ui/SafeSpaceTextInput';
import { showErrorToast } from '@/utils/toast';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithGoogle, signInWithApple, signInWithGitHub } from '@/lib/auth/supabaseOAuth';
import { SafeSpaceTitle, SafeSpaceCaption } from '@/components/ui/SafeSpaceText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { useAuth } from '@/contexts/AuthContext';
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
  const [githubLoading, setGitHubLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const { signIn } = useAuth();
  const { theme } = useThemeContext();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showErrorToast('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',mode:'no-cors',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.tsx:99',message:'Login submit started',data:{emailProvided:!!email.trim(),emailDomain:email.trim().split('@')[1] || null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const { error } = await signIn(email, password);
      if (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',mode:'no-cors',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.tsx:103',message:'Login signIn returned error',data:{errorMessage:error?.message,errorName:error?.name,errorStatus:error?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        console.error('[Login] Sign in error:', error);
        showErrorToast(error.message || 'Login failed');
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',mode:'no-cors',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.tsx:106',message:'Login signIn success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        // Navigation will be handled by auth state change
        router.replace('/(tabs)/(home)');
      }
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',mode:'no-cors',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.tsx:110',message:'Login signIn threw exception',data:{errorMessage:error?.message,errorName:error?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error('[Login] Unexpected error:', error);
      showErrorToast(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.replace('/(tabs)/(home)');
    } catch (error: any) {
      console.error('[Login] Google sign-in error:', error);
      showErrorToast(error.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setGitHubLoading(true);
    try {
      await signInWithGitHub();
      router.replace('/(tabs)/(home)');
    } catch (error: any) {
      console.error('[Login] GitHub sign-in error:', error);
      showErrorToast(error.message || 'GitHub sign-in failed');
    } finally {
      setGitHubLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      await signInWithApple();
      router.replace('/(tabs)/(home)');
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
