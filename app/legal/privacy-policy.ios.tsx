
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

const PRIVACY_POLICY_TEXT = `Privacy Policy — Safe Space ByCelina
Last updated: 6 December 2025
Location: Amman, Jordan

This Privacy Policy explains how Safe Space ByCelina ("Safe Space", "we", "our", "us") collects, uses, and protects your information when you use our mobile application ("App").

By using Safe Space, you agree to the practices described in this Privacy Policy.

1. Purpose of Safe Space
Safe Space is an AI-assisted emotional support app. It helps you reflect on your emotions and relationships, but it is not a substitute for professional mental health treatment or crisis support.

If you are in crisis, you must contact local emergency services or a qualified professional immediately.

2. Information We Collect

2.1. Account Information
We may collect your email address, password (securely stored), and basic preferences such as theme settings.

2.2. Emotional & Relationship Content
You may enter thoughts, feelings, relationship details, and personal reflections. This content is used to generate AI responses and maintain conversation history.

2.3. Technical Data
We may collect device type, anonymous usage analytics, and crash reports. We do not intentionally collect precise location unless you provide it in text.

3. How We Use Your Information
We use your data to operate the App, generate AI reflections, improve usability, and maintain security. We do not sell your data.

4. AI Processing
Your message content may be sent to an AI provider to generate responses. Data is processed respectfully and not used for personal identification outside the service.

5. Data Storage & Security
Your data is stored using backend services applying industry-standard security. No online system can guarantee 100% security.

6. How Long We Keep Data
Data may be retained while your account is active or as needed for legal or operational purposes. You may request account deletion.

7. Sharing of Information
We only share data with service providers necessary to operate the App, comply with law, or protect safety. We do not sell your information.

8. Children's Privacy
Safe Space is for ages 13+. We do not knowingly collect data from users under 13.

9. Your Rights
Where applicable, you may request access, correction, or deletion of your data by contacting: celi.bycelina@gmail.com

10. International Use
Your data may be stored or processed in different countries depending on service providers.

11. Changes to This Policy
Updates may occur. Continued use after changes indicates acceptance.

12. Contact
For questions: celi.bycelina@gmail.com`;

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
