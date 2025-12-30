
import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeSpaceTitle } from '@/components/ui/SafeSpaceText';
import { SafeSpaceTextInput } from '@/components/ui/SafeSpaceTextInput';
import { SafeSpaceButton } from '@/components/ui/SafeSpaceButton';
import { SafeSpaceLinkButton } from '@/components/ui/SafeSpaceLinkButton';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { supabase } from '@/lib/supabase';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen() {
  const { theme } = useThemeContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      console.log('[Login] Attempting to sign in:', email);
      
      // Step 1: Sign in with Supabase Auth
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        console.error('[Login] Sign in error:', signInError);
        
        // Handle specific error cases
        if (signInError.message.includes('Email not confirmed')) {
          setError('Please verify your email before logging in. Check your inbox for the verification link.');
          setIsLoading(false);
          return;
        }
        
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
          setIsLoading(false);
          return;
        }

        // Generic error
        setError(signInError.message || 'Login failed. Please try again.');
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        console.error('[Login] No user returned from sign in');
        setError('Login failed. Please try again.');
        setIsLoading(false);
        return;
      }

      console.log('[Login] Sign in successful:', authData.user.email);

      // Step 2: Ensure user profile exists in public.users
      const userId = authData.user.id;
      console.log('[Login] Checking user profile for:', userId);

      try {
        const { data: userProfile, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.warn('[Login] Error fetching user profile:', fetchError);
        }

        // Step 3: If user profile doesn't exist, create it
        if (!userProfile) {
          console.log('[Login] User profile not found, creating one...');
          
          const { error: insertError } = await supabase
            .from('users')
            .insert([{
              id: userId,
              email: authData.user.email,
              role: 'free',
            }]);

          if (insertError) {
            // Check if it's a duplicate key error (race condition)
            if (insertError.code === '23505') {
              console.log('[Login] User profile already exists (race condition)');
            } else {
              console.warn('[Login] Failed to create user profile:', insertError);
              // Don't block login - the AuthContext will handle this
            }
          } else {
            console.log('[Login] User profile created successfully');
          }
        } else {
          console.log('[Login] User profile found');
        }
      } catch (profileError) {
        console.warn('[Login] Exception handling user profile:', profileError);
        // Don't block login - the AuthContext will handle this
      }

      // Step 4: Navigate to Home screen
      console.log('[Login] Navigating to Home screen...');
      router.replace('/(tabs)/(home)/');
      
    } catch (err: any) {
      console.error('[Login] Unexpected login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    console.log('[Login] Navigating to forgot password screen');
    router.push('/forgot-password');
  };

  return (
    <LinearGradient
      colors={theme.primaryGradient}
      style={styles.gradientBackground}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoider>
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

                <View style={styles.passwordContainer}>
                  <SafeSpaceTextInput
                    placeholder="Password"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (error) setError(null);
                    }}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    containerStyle={styles.passwordInputContainer}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIconContainer}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={24}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  onPress={handleForgotPassword}
                  disabled={isLoading}
                  style={styles.forgotPasswordContainer}
                >
                  <Text style={[styles.forgotPasswordText, { color: theme.buttonText }]}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

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
        </KeyboardAvoider>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Math.min(SCREEN_WIDTH * 0.06, 24),
    paddingVertical: SCREEN_HEIGHT * 0.025,
    minHeight: SCREEN_HEIGHT * 0.85,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: SCREEN_HEIGHT * 0.05,
  },
  titleContainer: {
    marginBottom: Math.min(SCREEN_HEIGHT * 0.04, 32),
  },
  form: {
    width: '100%',
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInputContainer: {
    marginBottom: 0,
  },
  eyeIconContainer: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
    zIndex: 1,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
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
