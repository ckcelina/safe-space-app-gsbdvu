
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
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '@/contexts/ThemeContext';
import { ThemeType } from '@/types/database.types';

export default function ThemeSelectionScreen() {
  const { setTheme } = useThemeContext();
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('ocean-blue');

  const themes = [
    { 
      id: 'ocean-blue' as ThemeType, 
      name: 'Ocean Blue', 
      color: '#1890FF',
      gradient: ['#E6F7FF', '#BAE7FF'],
      description: 'Calm and serene like the ocean'
    },
    { 
      id: 'soft-rose' as ThemeType, 
      name: 'Soft Rose', 
      color: '#FF69B4',
      gradient: ['#FFF0F5', '#FFE4E1'],
      description: 'Gentle and nurturing warmth'
    },
    { 
      id: 'forest-green' as ThemeType, 
      name: 'Forest Green', 
      color: '#228B22',
      gradient: ['#F0F8F0', '#E8F5E8'],
      description: 'Grounded and peaceful nature'
    },
    { 
      id: 'sunny-yellow' as ThemeType, 
      name: 'Sunny Yellow', 
      color: '#F59E0B',
      gradient: ['#FFFBEA', '#FEF3C7'],
      description: 'Bright and uplifting energy'
    },
  ];

  const handleContinue = async () => {
    await setTheme(selectedTheme);
    router.push('/signup');
  };

  const handleBack = () => {
    router.back();
  };

  const currentTheme = themes.find(t => t.id === selectedTheme) || themes[0];

  return (
    <LinearGradient
      colors={currentTheme.gradient}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Choose Your Theme</Text>
          <Text style={styles.subtitle}>
            Select a color theme that resonates with you. You can change this later in settings.
          </Text>

          <View style={styles.themeSection}>
            {themes.map((theme) => (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeOption,
                  {
                    borderColor: selectedTheme === theme.id ? theme.color : '#E0E0E0',
                    borderWidth: selectedTheme === theme.id ? 3 : 2,
                    backgroundColor: selectedTheme === theme.id ? '#FFFFFF' : '#F9F9F9',
                  },
                ]}
                onPress={() => setSelectedTheme(theme.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.colorCircle, { backgroundColor: theme.color }]}
                />
                <View style={styles.themeInfo}>
                  <Text style={styles.themeName}>{theme.name}</Text>
                  <Text style={styles.themeDescription}>{theme.description}</Text>
                </View>
                {selectedTheme === theme.id && (
                  <View style={[styles.checkmark, { backgroundColor: theme.color }]}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.continueButton, { backgroundColor: currentTheme.color }]}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.8}
            >
              <Text style={[styles.backButtonText, { color: currentTheme.color }]}>
                Back
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#001529',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#595959',
    lineHeight: 24,
  },
  themeSection: {
    marginBottom: 32,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  colorCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.15)',
    elevation: 3,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#001529',
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 14,
    color: '#8C8C8C',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  continueButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 16,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 3,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 50,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
