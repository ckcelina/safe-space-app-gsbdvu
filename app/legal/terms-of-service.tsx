
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeContext } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';

const TERMS_OF_SERVICE_TEXT = `Terms of Service & Use — Safe Space ByCelina
Last updated: 6 December 2025
Location: Amman, Jordan

Welcome to Safe Space ByCelina ("Safe Space", "we", "our", "us"). These Terms govern your use of the Safe Space app.

By creating an account or continuing to use the App, you agree to these Terms.

1. Purpose of the App
Safe Space is an AI-assisted emotional support tool. It is not professional therapy, crisis help, medical advice, or legal guidance.

If you are in danger or experiencing a crisis, contact emergency services immediately.

2. Eligibility
You must be at least 13 years old and legally allowed to use the App in your country. Users under 18 should use the App with parental awareness where required by law.

3. Your Account
You are responsible for your login credentials and any activity under your account. If you suspect unauthorized access, change your password and email us at: celi.bycelina@gmail.com

4. Subscriptions & Billing
We offer a free plan with limited access and a premium plan with additional features.  
Billing, refunds, and subscription management are handled through the app store (not by us).

5. Cancellation
You may cancel through your device app store settings. You retain premium access until the current billing period ends.

6. Acceptable Use
You agree not to use the App for harmful, abusive, or illegal purposes, and not to interfere with or attempt to reverse-engineer the App.

7. AI Content
AI responses may not always be accurate or appropriate. You are responsible for decisions you make. The AI is not a therapist or professional advisor.

8. Intellectual Property
All content, designs, and branding belong to Safe Space ByCelina. You receive a personal, non-transferable license to use the App.

9. Termination & Account Deletion
You may request deletion of your account. We may suspend or terminate access if Terms are violated or required by law.

10. Limitation of Liability
Safe Space ByCelina is not responsible for any damages resulting from your use of AI content or the App.

11. Updates to the App & Terms
We may update these Terms. Continued use means you accept the updates.

12. Governing Law
These Terms are governed by Jordanian law. Disputes shall be heard in the courts of Amman, Jordan.

13. Contact
For questions: celi.bycelina@gmail.com`;

export default function TermsOfServiceScreen() {
  const { theme } = useThemeContext();

  const handleBack = () => {
    router.back();
  };

  return (
    <LinearGradient
      colors={theme.primaryGradient}
      style={styles.gradientBackground}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          {/* Header with Back Button */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handleBack} 
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="chevron.left"
                android_material_icon_name="arrow_back"
                size={24}
                color={theme.buttonText}
              />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.buttonText }]}>
              Terms of Service & Use
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.contentCard, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
              <Text style={[styles.contentText, { color: theme.textPrimary }]}>
                {TERMS_OF_SERVICE_TEXT}
              </Text>
            </View>
          </ScrollView>
        </View>
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  contentCard: {
    borderRadius: 16,
    padding: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
});
