
import { SafeSpaceButton } from '@/components/ui/SafeSpaceButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeSpaceTitle, SafeSpaceCaption } from '@/components/ui/SafeSpaceText';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeSpaceTextInput } from '@/components/ui/SafeSpaceTextInput';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { SafeSpaceLinkButton } from '@/components/ui/SafeSpaceLinkButton';
import { signInWithGoogle, signInWithApple } from '@/lib/auth/supabaseOAuth';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

export default function LoginScreen() {
  const { theme } = useThemeContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace('/(tabs)/(home)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setOauthLoading('google');
    try {
      await signInWithGoogle();
      showSuccessToast('Signed in with Google');
      router.replace('/(tabs)/(home)');
    } catch (error: any) {
      showErrorToast(error.message || 'Google sign in failed');
    } finally {
      setOauthLoading(null);
    }
  }

  async function handleAppleSignIn() {
    setOauthLoading('apple');
    try {
      await signInWithApple();
      showSuccessToast('Signed in with Apple');
      router.replace('/(tabs)/(home)');
    } catch (error: any) {
      showErrorToast(error.message || 'Apple sign in failed');
    } finally {
      setOauthLoading(null);
    }
  }

  return (
    <LinearGradient colors={theme.gradientColors} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoider>
          <View style={styles.content}>
            <SafeSpaceTitle style={styles.title}>Welcome Back</SafeSpaceTitle>
            <SafeSpaceCaption style={styles.subtitle}>Sign in to continue</SafeSpaceCaption>

            <SafeSpaceTextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <SafeSpaceTextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />

            <SafeSpaceButton
              title={loading ? 'Signing in...' : 'Sign In'}
              onPress={handleLogin}
              disabled={loading || oauthLoading !== null}
              style={styles.button}
            />

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.textSecondary }]} />
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.textSecondary }]} />
            </View>

            <TouchableOpacity
              style={[styles.oauthButton, { backgroundColor: theme.cardBackground }]}
              onPress={handleGoogleSignIn}
              disabled={loading || oauthLoading !== null}
            >
              {oauthLoading === 'google' ? (
                <ActivityIndicator color={theme.textPrimary} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color={theme.textPrimary} />
                  <Text style={[styles.oauthButtonText, { color: theme.textPrimary }]}>
                    Continue with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.oauthButton, { backgroundColor: theme.cardBackground }]}
              onPress={handleAppleSignIn}
              disabled={loading || oauthLoading !== null}
            >
              {oauthLoading === 'apple' ? (
                <ActivityIndicator color={theme.textPrimary} />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={20} color={theme.textPrimary} />
                  <Text style={[styles.oauthButtonText, { color: theme.textPrimary }]}>
                    Continue with Apple
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <SafeSpaceLinkButton
              title="Don't have an account? Sign up"
              onPress={() => router.push('/signup')}
              style={styles.linkButton}
            />
          </View>
        </KeyboardAvoider>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 32, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, marginBottom: 32, textAlign: 'center' },
  input: { marginBottom: 16 },
  button: { marginTop: 8 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: { flex: 1, height: 1, opacity: 0.3 },
  dividerText: { marginHorizontal: 16, fontSize: 14 },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  oauthButtonText: { fontSize: 16, fontWeight: '600' },
  linkButton: { marginTop: 16 },
});
