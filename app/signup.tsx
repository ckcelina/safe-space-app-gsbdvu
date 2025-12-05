
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const { colors } = useThemeContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      Alert.alert('Error', 'Please accept Terms and Privacy Policy');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Signup Error', error.message || 'An error occurred during signup');
    } else {
      Alert.alert(
        'Success! 🎉',
        'Account created successfully!\n\nPlease check your email to verify your account before logging in.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
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
            <View style={styles.themePreviewContainer}>
              <Text style={[styles.themePreviewLabel, { color: colors.textSecondary }]}>
                Your Theme
              </Text>
              <View style={styles.themePreviewRow}>
                <View style={[styles.themePreviewCircle, { backgroundColor: colors.primary }]} />
                <View style={[styles.themePreviewCircle, { backgroundColor: colors.secondary }]} />
                <View style={[styles.themePreviewCircle, { backgroundColor: colors.accent }]} />
              </View>
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              Create Account
            </Text>

            <View style={styles.form}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.accent }]}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />

              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.accent }]}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />

              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.accent }]}
                placeholder="Confirm Password"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading}
              />

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setTermsAccepted(!termsAccepted)}
                disabled={loading}
              >
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: colors.primary },
                    termsAccepted && { backgroundColor: colors.primary },
                  ]}
                >
                  {termsAccepted && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.text }]}>
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
                    { borderColor: colors.primary },
                    privacyAccepted && { backgroundColor: colors.primary },
                  ]}
                >
                  {privacyAccepted && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                  I accept the Privacy Policy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary },
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Sign Up</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.replace('/login')}
                disabled={loading}
                style={styles.linkContainer}
              >
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  Already have an account? Log In
                </Text>
              </TouchableOpacity>
            </View>

            {/* Disclaimer with proper spacing */}
            <View style={styles.disclaimerContainer}>
              <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
                By continuing, you agree this is a supportive AI coach, not a substitute for professional care.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 60,
  },
  content: {
    width: '100%',
  },
  themePreviewContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  themePreviewLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  themePreviewRow: {
    flexDirection: 'row',
    gap: 12,
  },
  themePreviewCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  input: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
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
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  linkContainer: {
    marginBottom: 32,
  },
  linkText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  disclaimerContainer: {
    marginTop: 24,
    paddingHorizontal: 8,
  },
  disclaimerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
