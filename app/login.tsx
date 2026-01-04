
import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SafeSpaceTitle } from '@/components/ui/SafeSpaceText';
import { SafeSpaceTextInput } from '@/components/ui/SafeSpaceTextInput';
import { SafeSpaceButton } from '@/components/ui/SafeSpaceButton';
import { SafeSpaceLinkButton } from '@/components/ui/SafeSpaceLinkButton';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { supabase, isSupabaseConfigured, getSupabaseConfigError } from '@/lib/supabase';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Timeout wrapper for async operations
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 15000,
  operation: string = 'Operation'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Check if error is a network/connection issue
 */
function isNetworkError(error: any): boolean {
  const message = error?.message?.toLowerCase() || '';
  const errorString = String(error).toLowerCase();
  
  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('offline') ||
    message.includes('failed to fetch') ||
    errorString.includes('network request failed') ||
    errorString.includes('authretryablefetcherror')
  );
}

/**
 * Get user-friendly error message
 */
function getUserFriendlyError(error: any): string {
  // Check for network errors first
  if (isNetworkError(error)) {
    return 'Connection issue. Please check your internet and try again.';
  }

  // Check for specific Supabase error messages
  const message = error?.message || String(error);
  
  if (message.includes('Email not confirmed')) {
    return 'Please verify your email before logging in.';
  }
  
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  
  if (message.includes('timeout')) {
    return 'Connection timeout. Please try again.';
  }

  // Generic error
  return message || 'Login failed. Please try again.';
}

export default function LoginScreen() {
  const { gradientColors } = useThemeContext();
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

    // Check Supabase configuration before attempting login
    if (!isSupabaseConfigured()) {
      const configError = getSupabaseConfigError();
      console.error('[Login] Supabase not configured:', configError);
      
      if (__DEV__) {
        setError(configError || 'Supabase not configured. Check .env file.');
      } else {
        setError('App configuration error. Please contact support.');
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[Login] Attempting to sign in:', email);
      console.log('[Login] Supabase configured:', isSupabaseConfigured());
      
      // Step 1: Sign in with Supabase Auth (with timeout)
      const signInPromise = supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      const { data: authData, error: signInError } = await withTimeout(
        signInPromise,
        15000,
        'Sign in'
      );

      if (signInError) {
        console.error('[Login] Sign in error:', signInError);
        
        // Handle specific error cases with user-friendly messages
        if (signInError.message.includes('Email not confirmed')) {
          Alert.alert(
            'Email Not Verified',
            'Please verify your email before logging in. Check your inbox for the verification link.',
            [{ text: 'OK' }]
          );
          setIsLoading(false);
          return;
        }
        
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
          setIsLoading(false);
          return;
        }

        // Use user-friendly error message
        setError(getUserFriendlyError(signInError));
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

      // Step 2: Ensure user profile exists in public.users (with timeout)
      const userId = authData.user.id;
      console.log('[Login] Checking user profile for:', userId);

      try {
        const fetchPromise = supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        const { data: userProfile, error: fetchError } = await withTimeout(
          fetchPromise,
          10000,
          'Fetch user profile'
        );

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.warn('[Login] Error fetching user profile:', fetchError);
        }

        // Step 3: If user profile doesn't exist, create it (with timeout)
        if (!userProfile) {
          console.log('[Login] User profile not found, creating one...');
          
          const insertPromise = supabase
            .from('users')
            .insert([{
              id: userId,
              email: authData.user.email,
              role: 'free',
            }]);

          const { error: insertError } = await withTimeout(
            insertPromise,
            10000,
            'Create user profile'
          );

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
        
        // If it's a network error, show a warning but don't block login
        if (isNetworkError(profileError)) {
          console.warn('[Login] Network error during profile setup, continuing anyway');
        }
        // Don't block login - the AuthContext will handle this
      }

      // Step 4: Navigate to Home screen
      console.log('[Login] Navigating to Home screen...');
      router.replace('/(tabs)/(home)/');
      
    } catch (err: any) {
      console.error('[Login] Unexpected login error:', err);
      
      // Provide user-friendly error message
      setError(getUserFriendlyError(err));
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
      colors={gradientColors}
      style={styles.gradientBackground}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar style="light" translucent backgroundColor="transparent" />
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
                <SafeSpaceTitle style={{ color: '#FFFFFF' }}>
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
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  onPress={handleForgotPassword}
                  disabled={isLoading}
                  style={styles.forgotPasswordContainer}
                >
                  <Text style={[styles.forgotPasswordText, { color: '#FFFFFF' }]}>
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
                  style={{ color: '#FFFFFF' }}
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
