
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
import { StatusBarGradient } from '@/components/ui/StatusBarGradient';

// Placeholder text - replace with your actual privacy policy
const PRIVACY_POLICY_TEXT = `Privacy Policy

Last Updated: [Date]

Welcome to Safe Space. Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.

1. Information We Collect

We collect information that you provide directly to us when you:
- Create an account
- Use our services
- Communicate with us

Personal Information may include:
- Email address
- Account credentials
- Profile information
- Conversation data

2. How We Use Your Information

We use the information we collect to:
- Provide, maintain, and improve our services
- Process your requests and transactions
- Send you technical notices and support messages
- Respond to your comments and questions
- Protect against fraudulent or illegal activity

3. Data Storage and Security

We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

Your conversation data is stored securely and is only accessible to you. We use industry-standard encryption to protect data in transit and at rest.

4. Data Sharing and Disclosure

We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
- With your consent
- To comply with legal obligations
- To protect our rights and safety

5. Your Rights

You have the right to:
- Access your personal information
- Correct inaccurate data
- Delete your account and associated data
- Opt-out of certain data collection

6. Third-Party Services

Our app may use third-party services (such as Supabase for backend services) that have their own privacy policies. We encourage you to review their policies.

7. Children's Privacy

Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.

8. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.

9. International Data Transfers

Your information may be transferred to and maintained on servers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ.

10. Contact Us

If you have questions or concerns about this Privacy Policy, please contact us at:
Email: support@safespace.app

By using Safe Space, you agree to the collection and use of information in accordance with this Privacy Policy.`;

export default function PrivacyPolicyScreen() {
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
      <StatusBarGradient />
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
              Privacy Policy
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
                {PRIVACY_POLICY_TEXT}
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
