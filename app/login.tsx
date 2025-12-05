
import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeSpaceScreen } from '@/components/ui/SafeSpaceScreen';
import { SafeSpaceTitle } from '@/components/ui/SafeSpaceText';
import { SafeSpaceTextInput } from '@/components/ui/SafeSpaceTextInput';
import { SafeSpaceButton } from '@/components/ui/SafeSpaceButton';
import { SafeSpaceLinkButton } from '@/components/ui/SafeSpaceLinkButton';
import { supabase } from '@/lib/supabase';
import { useThemeContext } from '@/contexts/ThemeContext';

export default function LoginScreen() {
  const { theme } = useThemeContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    // 1. Validate inputs
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    // 2. Set loading state and clear previous error
    setIsLoading(true);
    setError(null);

    try {
      // 3. Call Supabase signInWithPassword
      console.log('Attempting to sign in:', email);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // 4. Handle error
      if (signInError) {
        console.error('Sign in error:', signInError);
        setError('Invalid email or password. Please try again.');
        return;
      }

      // 5. Navigate on success
      console.log('Sign in successful:', data.user?.email);
      router.replace('/(tabs)/(home)/');
    } catch (err: any) {
      console.error('Unexpected login error:', err);
      setError('Invalid email or password. Please try again.');
    } finally {
      // 6. Always reset loading state
      setIsLoading(false);
    }
  };

  return (
    <SafeSpaceScreen scrollable={true} keyboardAware={true} useGradient={true}>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <SafeSpaceTitle>Welcome Back</SafeSpaceTitle>
        </View>

        <View style={styles.form}>
          <SafeSpaceTextInput
            placeholder="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError(null); // Clear error when user types
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
          />

          <SafeSpaceTextInput
            placeholder="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError(null); // Clear error when user types
            }}
            secureTextEntry
            editable={!isLoading}
          />

          {/* Error message display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.buttonSpacing} />

          <SafeSpaceButton 
            onPress={handleLogin} 
            loading={isLoading} 
            disabled={isLoading}
          >
            {isLoading ? 'Logging in…' : 'Log In'}
          </SafeSpaceButton>

          <View style={styles.linkSpacing} />

          <SafeSpaceLinkButton 
            onPress={() => router.replace('/signup')} 
            disabled={isLoading}
          >
            Don&apos;t have an account? Sign Up
          </SafeSpaceLinkButton>
        </View>
      </View>
    </SafeSpaceScreen>
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
  errorContainer: {
    marginTop: 12,
    marginBottom: 4,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonSpacing: {
    height: 8,
  },
  linkSpacing: {
    height: 8,
  },
});
