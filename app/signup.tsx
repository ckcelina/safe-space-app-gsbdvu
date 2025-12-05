
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeSpaceTitle, SafeSpaceCaption } from '@/components/ui/SafeSpaceText';
import { SafeSpaceTextInput } from '@/components/ui/SafeSpaceTextInput';
import { SafeSpaceButton } from '@/components/ui/SafeSpaceButton';
import { SafeSpaceLinkButton } from '@/components/ui/SafeSpaceLinkButton';
import { StatusBarGradient } from '@/components/ui/StatusBarGradient';
import { useThemeContext } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';

export default function SignupScreen() {
  const { theme } = useThemeContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignup = async () => {
    setErrorMessage(null);

    // Validation
    if (!email || !password) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      setErrorMessage('Please accept Terms and Privacy Policy');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Attempting to sign up:', email);
      
      // Step 1: Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed'
        }
      });

      if (authError) {
        console.error('Signup error:', authError);
        setErrorMessage(authError.message || 'An error occurred during signup');
        return;
      }

      if (!authData.user) {
        console.error('No user returned from signup');
        setErrorMessage('Failed to create account. Please try again.');
        return;
      }

      console.log('Auth signup successful:', authData.user.id);

      // Step 2: Insert into public.users
      // If this fails, log a warning but still treat signup as successful
      try {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: authData.user.email,
              role: 'free',
            },
          ]);

        if (insertError) {
          console.warn('Warning: Failed to insert user profile:', insertError);
          // Don't block the user - they can still use the app
        } else {
          console.log('User profile created successfully');
        }
      } catch (profileError) {
        console.warn('Warning: Exception creating user profile:', profileError);
        // Don't block the user
      }

      // Step 3: Show success message
      Alert.alert(
        'Account Created!',
        'Please check your email to verify your account. You can still use the app while waiting for verification.',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('Navigating to home screen');
              router.replace('/(tabs)/(home)');
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('Unexpected signup error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = 
    email.trim() !== '' && 
    password.trim() !== '' && 
    confirmPassword.trim() !== '' && 
    termsAccepted && 
    privacyAccepted;

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
              {/* Theme Preview */}
              <View style={styles.themePreview}>
                <SafeSpaceCaption align="center" style={{ color: theme.buttonText, opacity: 0.9 }}>
                  Your Theme
                </SafeSpaceCaption>
                <View style={styles.themePreviewRow}>
                  <View style={[styles.themeCircle, { backgroundColor: 'rgba(255, 255, 255, 0.8)' }]} />
                  <View style={[styles.themeCircle, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]} />
                  <View style={[styles.themeCircle, { backgroundColor: 'rgba(255, 255, 255, 0.7)' }]} />
                </View>
              </View>

              <View style={styles.titleContainer}>
                <SafeSpaceTitle style={{ color: theme.buttonText }}>
                  Create Account
                </SafeSpaceTitle>
              </View>

              <View style={styles.form}>
                <SafeSpaceTextInput
                  placeholder="Email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />

                <SafeSpaceTextInput
                  placeholder="Password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  secureTextEntry
                  editable={!loading}
                />

                <SafeSpaceTextInput
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  secureTextEntry
                  editable={!loading}
                />

                <View style={styles.checkboxSection}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setTermsAccepted(!termsAccepted)}
                    disabled={loading}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        { borderColor: 'rgba(255, 255, 255, 0.8)' },
                        termsAccepted && { backgroundColor: 'rgba(255, 255, 255, 0.95)' },
                      ]}
                    >
                      {termsAccepted && <Text style={[styles.checkmark, { color: theme.primary }]}>✓</Text>}
                    </View>
                    <Text style={[styles.checkboxLabel, { color: theme.buttonText }]}>
                      I accept the Terms & Conditions
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setPrivacyAccepted(!privacyAccepted)}
                    disabled={loading}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        { borderColor: 'rgba(255, 255, 255, 0.8)' },
                        privacyAccepted && { backgroundColor: 'rgba(255, 255, 255, 0.95)' },
                      ]}
                    >
                      {privacyAccepted && <Text style={[styles.checkmark, { color: theme.primary }]}>✓</Text>}
                    </View>
                    <Text style={[styles.checkboxLabel, { color: theme.buttonText }]}>
                      I accept the Privacy Policy
                    </Text>
                  </TouchableOpacity>
                </View>

                {errorMessage && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                <View style={styles.buttonSpacing} />

                <SafeSpaceButton 
                  onPress={handleSignup} 
                  loading={loading} 
                  disabled={loading || !isFormValid}
                >
                  {loading ? 'Creating Account…' : 'Sign Up'}
                </SafeSpaceButton>

                <View style={styles.linkSpacing} />

                <SafeSpaceLinkButton 
                  onPress={() => router.replace('/login')} 
                  disabled={loading}
                  style={{ color: theme.buttonText }}
                >
                  Already have an account? Log In
                </SafeSpaceLinkButton>
              </View>

              {/* Disclaimer */}
              <View style={styles.disclaimerContainer}>
                <SafeSpaceCaption align="center" style={{ color: theme.buttonText, opacity: 0.8 }}>
                  By continuing, you agree this is a supportive AI coach, not a substitute for professional care.
                </SafeSpaceCaption>
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
    paddingVertical: 20,
  },
  themePreview: {
    alignItems: 'center',
    marginBottom: 24,
  },
  themePreviewRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  themeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  titleContainer: {
    marginBottom: 24,
  },
  form: {
    width: '100%',
  },
  checkboxSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    flex: 1,
  },
  errorContainer: {
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  buttonSpacing: {
    height: 8,
  },
  linkSpacing: {
    height: 8,
  },
  disclaimerContainer: {
    marginTop: 32,
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
});
