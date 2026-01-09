
import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeSpaceScreen } from '@/components/ui/SafeSpaceScreen';
import { SafeSpaceTitle, SafeSpaceSubtitle } from '@/components/ui/SafeSpaceText';
import { SafeSpaceButton } from '@/components/ui/SafeSpaceButton';
import { SafeSpaceLinkButton } from '@/components/ui/SafeSpaceLinkButton';
import { ThemeOptionCard } from '@/components/ui/ThemeOptionCard';
import { useThemeContext, ThemeKey } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function ThemeSelectionScreen() {
  const { themeKey, setTheme } = useThemeContext();
  const { session } = useAuth();
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>(themeKey);

  const themes = [
    {
      id: 'OceanBlue' as ThemeKey,
      name: 'Ocean Blue',
      color: '#1890FF',
      description: 'Calm and serene like the ocean',
    },
    {
      id: 'SoftRose' as ThemeKey,
      name: 'Soft Rose',
      color: '#FF69B4',
      description: 'Gentle and nurturing warmth',
    },
    {
      id: 'ForestGreen' as ThemeKey,
      name: 'Forest Green',
      color: '#228B22',
      description: 'Grounded and peaceful nature',
    },
    {
      id: 'SunnyYellow' as ThemeKey,
      name: 'Sunny Yellow',
      color: '#F59E0B',
      description: 'Bright and uplifting energy',
    },
  ];

  const handleThemeSelect = async (newThemeKey: ThemeKey) => {
    setSelectedTheme(newThemeKey);
    // Update theme immediately for live preview
    await setTheme(newThemeKey);
  };

  const handleContinue = () => {
    router.push('/signup');
  };

  const handleBack = () => {
    router.back();
  };

  const handleSkip = () => {
    // If user is already authenticated, go to Home
    if (session) {
      console.log('User authenticated, skipping to Home');
      router.replace('/(tabs)/(home)');
    }
  };

  return (
    <SafeSpaceScreen scrollable={true} keyboardAware={false} useGradient={true}>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <SafeSpaceTitle>Choose Your Theme</SafeSpaceTitle>
          
          <SafeSpaceSubtitle>
            Select a color theme that resonates with you. You can change this later in settings.
          </SafeSpaceSubtitle>
        </View>

        <View style={styles.themeSection}>
          {themes.map((themeOption) => (
            <ThemeOptionCard
              key={themeOption.id}
              theme={themeOption}
              selected={selectedTheme === themeOption.id}
              onPress={() => handleThemeSelect(themeOption.id)}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <SafeSpaceButton onPress={handleContinue}>
            Continue
          </SafeSpaceButton>

          <SafeSpaceLinkButton onPress={handleBack}>
            Back
          </SafeSpaceLinkButton>

          {/* Skip for now link - only shown if user is authenticated */}
          {session && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipLink}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          )}
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
  titleContainer: {
    marginBottom: 32,
  },
  themeSection: {
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  skipLink: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline',
  },
});
