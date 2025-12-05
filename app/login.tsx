
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeSpaceScreen } from '@/components/ui/SafeSpaceScreen';
import { SafeSpaceTitle } from '@/components/ui/SafeSpaceText';
import { SafeSpaceTextInput } from '@/components/ui/SafeSpaceTextInput';
import { SafeSpaceButton } from '@/components/ui/SafeSpaceButton';
import { SafeSpaceLinkButton } from '@/components/ui/SafeSpaceLinkButton';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { useAuth } from '@/contexts/AuthContext';
import { showErrorToast } from '@/utils/toast';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      showErrorToast('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signIn(email, password);

      if (error) {
        let errorMessage = error.message || 'An error occurred during login';

        if (error.message?.includes('Email not confirmed')) {
          errorMessage =
            'Please verify your email before logging in. Check your inbox for the verification link.';
        } else if (error.message?.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        }

        showErrorToast(errorMessage);
      } else {
        router.replace('/(tabs)/(home)/');
      }
    } catch (err: any) {
      console.error('Unexpected login error:', err);
      showErrorToast('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SafeSpaceScreen scrollable={true} keyboardAware={true} useGradient={true}>
        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <SafeSpaceTitle>Welcome Back</SafeSpaceTitle>
          </View>

          <View style={styles.form}>
            <SafeSpaceTextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />

            <SafeSpaceTextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <View style={styles.buttonSpacing} />

            <SafeSpaceButton onPress={handleLogin} loading={loading} disabled={loading}>
              Log In
            </SafeSpaceButton>

            <View style={styles.linkSpacing} />

            <SafeSpaceLinkButton onPress={() => router.replace('/signup')} disabled={loading}>
              Don&apos;t have an account? Sign Up
            </SafeSpaceLinkButton>
          </View>
        </View>
      </SafeSpaceScreen>
      
      <LoadingOverlay visible={loading} />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  titleContainer: {
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  buttonSpacing: {
    height: 8,
  },
  linkSpacing: {
    height: 8,
  },
});
