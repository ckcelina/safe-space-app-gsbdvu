
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeSpaceTitle, SafeSpaceCaption } from '@/components/ui/SafeSpaceText';
import { SafeSpaceTextInput } from '@/components/ui/SafeSpaceTextInput';
import { SafeSpaceButton } from '@/components/ui/SafeSpaceButton';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { supabase } from '@/lib/supabase';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ResetPasswordScreen() {
  const { theme } = useThemeContext();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkRecoverySession = async () => {
      try {
        console.log('[ResetPassword] Checking for recovery session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[ResetPassword] Error checking session:', error);
          setIsValidSession(false);
          setCheckingSession(false);
          return;
        }

        if (session) {
          console.log('[ResetPassword] Valid recovery session found');
          setIsValidSession(true);
        } else {
          console.log('[ResetPassword] No recovery session found');
          setIsValidSession(false);
        }
      } catch (err: any) {
        console.error('[ResetPassword] Exception checking session:', err);
        setIsValidSession(false);
      } finally {
        setCheckingSession(false);
      }
    };

    checkRecoverySession();
  }, []);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[ResetPassword] Attempting to update password...');
      
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('[ResetPassword] Password update error:', updateError);
        
        if (updateError.message.includes('session')) {
          setError('Your password reset link has expired. Please request a new one.');
        } else if (updateError.message.includes('Password should be at least')) {
          setError('Password must be at least 6 characters long');
        } else {
          setError(updateError.message || 'Failed to update password. Please try again.');
        }
        
        setIsLoading(false);
        return;
      }

      console.log('[ResetPassword] Password updated successfully');

      Alert.alert(
        'Password Updated',
        'Your password has been successfully updated. You can now log in with your new password.',
        [
          {
            text: 'Go to Login',
            onPress: () => {
              console.log('[ResetPassword] Navigating to login screen');
              router.replace('/login');
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('[ResetPassword] Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <LinearGradient
        colors={theme.primaryGradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.centerContent}>
            <SafeSpaceCaption style={{ color: theme.buttonText }}>
              Verifying reset link...
            </SafeSpaceCaption>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!isValidSession) {
    return (
      <LinearGradient
        colors={theme.primaryGradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.centerContent}>
            <Ionicons name="alert-circle-outline" size={64} color={theme.buttonText} />
            <SafeSpaceTitle style={{ color: theme.buttonText, marginTop: 16 }}>
              Invalid or Expired Link
            </SafeSpaceTitle>
            <SafeSpaceCaption 
              align="center" 
              style={{ color: theme.buttonText, marginTop: 12, marginBottom: 24, paddingHorizontal: 32 }}
            >
              This password reset link is invalid or has expired. Please request a new password reset link.
            </SafeSpaceCaption>
            <SafeSpaceButton onPress={() => router.replace('/login')}>
              Back to Login
            </SafeSpaceButton>
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
                <Ionicons name="lock-closed-outline" size={64} color={theme.buttonText} />
              </View>

              <View style={styles.titleContainer}>
                <SafeSpaceTitle style={{ color: theme.buttonText }}>
                  Reset Password
                </SafeSpaceTitle>
                <SafeSpaceCaption 
                  align="center" 
                  style={{ color: theme.buttonText, marginTop: 8 }}
                >
                  Enter your new password below
                </SafeSpaceCaption>
              </View>

              <View style={styles.form}>
                <View style={styles.passwordContainer}>
                  <SafeSpaceTextInput
                    placeholder="New Password (min 6 characters)"
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
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

                <View style={styles.passwordContainer}>
                  <SafeSpaceTextInput
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (error) setError(null);
                    }}
                    secureTextEntry={!showConfirmPassword}
                    editable={!isLoading}
                    containerStyle={styles.passwordInputContainer}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIconContainer}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={24}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <View style={styles.buttonSpacing} />

                <SafeSpaceButton 
                  onPress={handleResetPassword} 
                  loading={isLoading} 
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating Password…' : 'Update Password'}
                </SafeSpaceButton>

                <View style={styles.linkSpacing} />

                <TouchableOpacity 
                  onPress={() => router.replace('/login')}
                  disabled={isLoading}
                  style={styles.backToLoginContainer}
                >
                  <Text style={[styles.backToLoginText, { color: theme.buttonText }]}>
                    Back to Login
                  </Text>
                </TouchableOpacity>
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
  backToLoginContainer: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
