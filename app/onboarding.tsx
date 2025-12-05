
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeSpaceScreen } from '@/components/ui/SafeSpaceScreen';
import { SafeSpaceTitle, SafeSpaceSubtitle } from '@/components/ui/SafeSpaceText';
import { SafeSpaceButton } from '@/components/ui/SafeSpaceButton';
import { SafeSpaceLinkButton } from '@/components/ui/SafeSpaceLinkButton';
import { IconSymbol } from '@/components/IconSymbol';
import { useThemeContext } from '@/contexts/ThemeContext';

export default function OnboardingScreen() {
  const { theme } = useThemeContext();

  const handleCreateSpace = () => {
    router.push('/theme-selection');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <SafeSpaceScreen scrollable={true} keyboardAware={false} useGradient={true}>
      <View style={styles.content}>
        {/* App Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconBackground, { backgroundColor: theme.card, borderColor: theme.primary }]}>
            <IconSymbol
              ios_icon_name="shield.fill"
              android_material_icon_name="shield"
              size={64}
              color={theme.primary}
            />
          </View>
        </View>

        {/* Title */}
        <SafeSpaceTitle style={styles.title}>Safe Space</SafeSpaceTitle>

        {/* Subtitle */}
        <SafeSpaceSubtitle style={styles.subtitle}>
          Your private emotional sanctuary for healing and growth.
        </SafeSpaceSubtitle>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <SafeSpaceButton onPress={handleCreateSpace}>
            Create My Safe Space
          </SafeSpaceButton>

          <SafeSpaceLinkButton variant="outline" onPress={handleLogin}>
            Log In
          </SafeSpaceLinkButton>
        </View>
      </View>
    </SafeSpaceScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)',
    elevation: 6,
  },
  title: {
    fontSize: 42,
    marginBottom: 16,
  },
  subtitle: {
    maxWidth: 360,
    paddingHorizontal: 16,
    marginBottom: 48,
    fontSize: 17,
    lineHeight: 26,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
  },
});
