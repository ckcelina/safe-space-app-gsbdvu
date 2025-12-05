
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useThemeContext } from '@/contexts/ThemeContext';
import { ThemeType } from '@/types/database.types';

export default function OnboardingScreen() {
  const { setTheme, colors } = useThemeContext();
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('ocean-blue');

  const themes = [
    { id: 'ocean-blue' as ThemeType, name: 'Ocean Blue', color: '#1890FF' },
    { id: 'soft-rose' as ThemeType, name: 'Soft Rose', color: '#FF69B4' },
    { id: 'forest-green' as ThemeType, name: 'Forest Green', color: '#228B22' },
  ];

  const handleContinue = async () => {
    await setTheme(selectedTheme);
    router.replace('/signup');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome to Safe Space
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            A safe place to talk about the people in your life
          </Text>

          <View style={styles.themeSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Choose Your Theme
            </Text>
            {themes.map((theme) => (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: colors.card,
                    borderColor: selectedTheme === theme.id ? theme.color : colors.accent,
                    borderWidth: selectedTheme === theme.id ? 3 : 1,
                  },
                ]}
                onPress={() => setSelectedTheme(theme.id)}
              >
                <View
                  style={[styles.colorCircle, { backgroundColor: theme.color }]}
                />
                <Text style={[styles.themeName, { color: colors.text }]}>
                  {theme.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.primary }]}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  themeSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
  },
  themeName: {
    fontSize: 18,
    fontWeight: '500',
  },
  continueButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
