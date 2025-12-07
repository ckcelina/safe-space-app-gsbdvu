
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeContext } from '@/contexts/ThemeContext';
import { StatusBarGradient } from '@/components/ui/StatusBarGradient';

export default function LibraryScreen() {
  const { theme } = useThemeContext();

  return (
    <LinearGradient
      colors={theme.primaryGradient}
      style={styles.gradientBackground}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBarGradient />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: theme.buttonText }]}>
                Library
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.buttonText, opacity: 0.9 }]}>
                Learn about different mental health topics in a safe, friendly way.
              </Text>
            </View>

            <View style={[styles.placeholderContainer, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
              <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
                Content coming soon...
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  placeholderContainer: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
