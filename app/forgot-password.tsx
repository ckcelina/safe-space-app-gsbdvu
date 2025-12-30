
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Dimensions, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeSpaceTitle, SafeSpaceCaption } from '@/components/ui/SafeSpaceText';
import { SafeSpaceTextInput } from '@/components/ui/SafeSpaceTextInput';
import { SafeSpaceButton } from '@/components/ui/SafeSpaceButton';
import { SafeSpaceLinkButton } from '@/components/ui/SafeSpaceLinkButton';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { supabase } from '@/lib/supabase';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const { theme } = useThemeContext();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendResetEmail = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[ForgotPassword] Sending password reset email to:', email);
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: 'https://natively.dev/reset-password',
        }
      );

      if (resetError) {
        console.error('[ForgotPassword] Password reset error:', resetError);
        setError('Failed to send password reset email. Please try again.');
        setIsLoading(false);
        return;
      }

      console.log('[ForgotPassword] Password reset email sent successfully');
      setEmailSent(true);
    } catch (err: any) {
      console.error('[ForgotPassword] Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <LinearGradient
        colors={theme.primaryGradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.centerContent}>
            <Ionicons name="mail-outline" size={64} color={theme.buttonText} />
            <SafeSpaceTitle style={{ color: theme.buttonText, marginTop: 16 }}>
              Check Your Email
            </SafeSpaceTitle>
            <SafeSpaceCaption 
              align="center" 
              style={{ color: theme.buttonText, marginTop: 12, marginBottom: 24, paddingHorizontal: 32 }}
            >
              If an account exists with {email}, you will receive a password reset link shortly. 
              Please check your inbox and spam folder.
            </SafeSpaceCaption>
            <SafeSpaceButton onPress={() => router.replace('/login')}>
              Back to Login
            </SafeSpaceButton>
            <View style={styles.linkSpacing} />
            <SafeSpaceLinkButton 
              onPress={() => {
                setEmailSent(false);
                setEmail('');
              }}
              style={{ color: theme.buttonText }}
            >
              Send Another Email
            </SafeSpaceLinkButton>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

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
              <View style={styles.iconContainer}>
                <Ionicons name="key-outline" size={64} color={theme.buttonText} />
              </View>

              <View style={styles.titleContainer}>
                <SafeSpaceTitle style={{ color: theme.buttonText }}>
                  Forgot Password?
                </SafeSpaceTitle>
                <SafeSpaceCaption 
                  align="center" 
                  style={{ color: theme.buttonText, marginTop: 8 }}
                >
                  Enter your email address and we&apos;ll send you a link to reset your password
                </SafeSpaceCaption>
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

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <View style={styles.buttonSpacing} />

                <SafeSpaceButton 
                  onPress={handleSendResetEmail} 
                  loading={isLoading} 
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending…' : 'Send Reset Link'}
                </SafeSpaceButton>

                <View style={styles.linkSpacing} />

                <SafeSpaceLinkButton 
                  onPress={() => router.replace('/login')} 
                  disabled={isLoading}
                  style={{ color: theme.buttonText }}
                >
                  Back to Login
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titleContainer: {
    marginBottom: Math.min(SCREEN_HEIGHT * 0.04, 32),
  },
  form: {
    width: '100%',
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
});
