
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

const TERMS_SUMMARY_TEXT = `Safe Space — Terms Summary

- Safe Space is an AI-based emotional support app.
- It is not therapy, medical treatment, or crisis support.
- You must be 13+ to use the app.
- You are responsible for how you use the app and the responses you receive.
- Subscriptions and billing are managed by the app store; you can cancel through your account settings.
- You must not use Safe Space to harm, threaten, or abuse others.
- You may request account and data deletion.

Full details are available in our "Terms of Service & Use" and "Privacy Policy".`;

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
              Terms Summary
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
                {TERMS_SUMMARY_TEXT}
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
