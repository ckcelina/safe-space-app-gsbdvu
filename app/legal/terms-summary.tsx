
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

const TERMS_CONDITIONS_TEXT = `Terms & Conditions — Safe Space ByCelina
Last updated: 6 December 2025
Location: Amman, Jordan

By using Safe Space ByCelina ("Safe Space", "we", "our", "us") you agree to:

• Use the app only for personal emotional reflection and support.  
• Understand that Safe Space is not therapy, crisis help, medical care, or legal advice.  
• Be at least 13 years old and legally allowed to use the app in your country.  
• Keep your login details private and not share your account with others.  
• Not use the app to harass, threaten, or harm anyone, including yourself.  
• Not try to hack, damage, or reverse-engineer the app or its services.  

Safe Space may offer a free plan and optional premium features.  
Billing and cancellations are handled by the app store platform that you use.

Your use of the app is also governed by:
• Our full Privacy Policy  
• Our full Terms of Service & Use

If you do not agree with these conditions, please do not use the app.

For questions, contact: celi.bycelina@gmail.com`;

export default function TermsSummaryScreen() {
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
              Terms & Conditions
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
                {TERMS_CONDITIONS_TEXT}
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
