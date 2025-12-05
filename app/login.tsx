
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeSpaceTitle } from '@/components/ui/SafeSpaceText';
import { SafeSpaceTextInput } from '@/components/ui/SafeSpaceTextInput';
import { SafeSpaceButton } from '@/components/ui/SafeSpaceButton';
import { SafeSpaceLinkButton } from '@/components/ui/SafeSpaceLinkButton';
import { StatusBarGradient } from '@/components/ui/StatusBarGradient';
import { supabase } from '@/lib/supabase';
import { useThemeContext } from '@/contexts/ThemeContext';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';

export default function LoginScreen() {
  const { theme } = useThemeContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting to sign in:', email);
      
      // Step 1: Sign in with Supabase Auth
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        setError('Invalid email or password. Please try again.');
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        console.error('No user returned from sign in');
        setError('Login failed. Please try again.');
        setIsLoading(false);
        return;
      }

      console.log('Sign in successful:', authData.user.email);

      // Step 2: Fetch or create user profile in public.users
      const userId = authData.user.id;
      console.log('Fetching user profile for:', userId);

      const { data: userProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        console.error('Error fetching user profile:', fetchError);
      }

      // Step 3: If user profile doesn't exist, create it
      if (!userProfile) {
        console.log('User profile not found, creating one...');
        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert([{
            id: userId,
            email: authData.user.email,
            role: 'free',
          }])
          .select()
          .single();

        if (insertError) {
          console.warn('Failed to create user profile:', insertError);
          // Don't block login if profile creation fails
        } else {
          console.log('User profile created successfully:', newProfile);
        }
      } else {
        console.log('User profile found:', userProfile);
      }

      // Step 4: Navigate to Home screen
      console.log('Navigating to Home screen...');
      router.replace('/(tabs)/(home)/');
      
    } catch (err: any) {
      console.error('Unexpected login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={theme.primaryGradient}
      style={styles.gradientBackground}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBarGradient />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View style={styles.content}>
              <View style={styles.titleContainer}>
                <SafeSpaceTitle style={{ color: theme.buttonText }}>
                  Welcome Back
                </SafeSpaceTitle>
              </View>

              <View style={styles.form}>
                <SafeSpaceTextInput
                  placeholder="Email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError(null);
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
                    if (error) setError(null);
                  }}
                  secureTextEntry
                  editable={!isLoading}
                />

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
                  style={{ color: theme.buttonText }}
                >
                  Don&apos;t have an account? Sign Up
                </SafeSpaceLinkButton>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
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
    fontWeight: '500',
  },
  buttonSpacing: {
    height: 8,
  },
  linkSpacing: {
    height: 8,
  },
});
