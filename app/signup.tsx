
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeSpaceScreen } from '@/components/ui/SafeSpaceScreen';
import { SafeSpaceTitle, SafeSpaceCaption } from '@/components/ui/SafeSpaceText';
import { SafeSpaceTextInput } from '@/components/ui/SafeSpaceTextInput';
import { SafeSpaceButton } from '@/components/ui/SafeSpaceButton';
import { SafeSpaceLinkButton } from '@/components/ui/SafeSpaceLinkButton';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const { theme } = useThemeContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignup = async () => {
    // Clear previous errors
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
      const { error } = await signUp(email, password);

      if (error) {
        console.error('Signup error:', error);
        // Display the actual error message from Supabase
        setErrorMessage(error.message || 'An error occurred during signup');
      } else {
        console.log('Signup successful! Redirecting to home...');
        // Navigate to Home screen on success
        router.replace('/(tabs)/(home)');
      }
    } catch (err: any) {
      console.error('Unexpected signup error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeSpaceScreen scrollable={true} keyboardAware={true} useGradient={true}>
      <View style={styles.content}>
        {/* Theme Preview */}
        <View style={styles.themePreview}>
          <SafeSpaceCaption align="center">Your Theme</SafeSpaceCaption>
          <View style={styles.themePreviewRow}>
            <View style={[styles.themeCircle, { backgroundColor: theme.primaryGradient[0] }]} />
            <View style={[styles.themeCircle, { backgroundColor: theme.primary }]} />
            <View style={[styles.themeCircle, { backgroundColor: theme.primaryGradient[1] }]} />
          </View>
        </View>

        <View style={styles.titleContainer}>
          <SafeSpaceTitle>Create Account</SafeSpaceTitle>
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
            {/* Checkboxes */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setTermsAccepted(!termsAccepted)}
              disabled={loading}
            >
              <View
                style={[
                  styles.checkbox,
                  { borderColor: theme.primary },
                  termsAccepted && { backgroundColor: theme.primary },
                ]}
              >
                {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.checkboxLabel, { color: theme.textPrimary }]}>
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
                  { borderColor: theme.primary },
                  privacyAccepted && { backgroundColor: theme.primary },
                ]}
              >
                {privacyAccepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.checkboxLabel, { color: theme.textPrimary }]}>
                I accept the Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error message display */}
          {errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.buttonSpacing} />

          <SafeSpaceButton 
            onPress={handleSignup} 
            loading={loading} 
            disabled={loading}
          >
            {loading ? 'Creating Account…' : 'Sign Up'}
          </SafeSpaceButton>

          <View style={styles.linkSpacing} />

          <SafeSpaceLinkButton 
            onPress={() => router.replace('/login')} 
            disabled={loading}
          >
            Already have an account? Log In
          </SafeSpaceLinkButton>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <SafeSpaceCaption align="center">
            By continuing, you agree this is a supportive AI coach, not a substitute for professional care.
          </SafeSpaceCaption>
        </View>
      </View>
    </SafeSpaceScreen>
  );
}

const styles = StyleSheet.create({
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
    color: '#FFFFFF',
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
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
