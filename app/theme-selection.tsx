
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeSpaceScreen } from '@/components/ui/SafeSpaceScreen';
import { SafeSpaceTitle, SafeSpaceSubtitle } from '@/components/ui/SafeSpaceText';
import { SafeSpaceButton } from '@/components/ui/SafeSpaceButton';
import { SafeSpaceLinkButton } from '@/components/ui/SafeSpaceLinkButton';
import { ThemeOptionCard } from '@/components/ui/ThemeOptionCard';
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
      description: 'Calm and serene like the ocean',
    },
    {
      id: 'soft-rose' as ThemeType,
      name: 'Soft Rose',
      color: '#FF69B4',
      gradient: ['#FFF0F5', '#FFE4E1'],
      description: 'Gentle and nurturing warmth',
    },
    {
      id: 'forest-green' as ThemeType,
      name: 'Forest Green',
      color: '#228B22',
      gradient: ['#F0F8F0', '#E8F5E8'],
      description: 'Grounded and peaceful nature',
    },
    {
      id: 'sunny-yellow' as ThemeType,
      name: 'Sunny Yellow',
      color: '#F59E0B',
      gradient: ['#FFFBEA', '#FEF3C7'],
      description: 'Bright and uplifting energy',
    },
  ];

  const handleThemeSelect = async (themeId: ThemeType) => {
    setSelectedTheme(themeId);
    // Update theme immediately for live preview
    await setTheme(themeId);
  };

  const handleContinue = () => {
    router.push('/signup');
  };

  const handleBack = () => {
    router.back();
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
          {themes.map((theme) => (
            <ThemeOptionCard
              key={theme.id}
              theme={theme}
              selected={selectedTheme === theme.id}
              onPress={() => handleThemeSelect(theme.id)}
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
});
