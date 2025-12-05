
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeSpaceScreen } from '@/components/ui/SafeSpaceScreen';
import { SafeSpaceTitle, SafeSpaceSubtitle, SafeSpaceCaption } from '@/components/ui/SafeSpaceText';
import { SafeSpaceButton } from '@/components/ui/SafeSpaceButton';
import { IconSymbol } from '@/components/IconSymbol';
import { useThemeContext } from '@/contexts/ThemeContext';

export default function OnboardingScreen() {
  const { colors } = useThemeContext();

  const handleCreateSpace = () => {
    router.push('/theme-selection');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <SafeSpaceScreen scrollable={false} keyboardAware={false} useGradient={true}>
      <View style={styles.content}>
        {/* Shield Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconBackground, { backgroundColor: colors.highlight, borderColor: colors.primary }]}>
            <IconSymbol
              ios_icon_name="shield.fill"
              android_material_icon_name="shield"
              size={64}
              color={colors.primary}
            />
          </View>
        </View>

        {/* Title */}
        <SafeSpaceTitle style={styles.title}>Safe Space</SafeSpaceTitle>

        {/* Subtitle */}
        <SafeSpaceSubtitle style={styles.subtitle}>
          Your private emotional sanctuary. A place to talk, reflect, heal, and understand your relationships — including the one with yourself.
        </SafeSpaceSubtitle>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <SafeSpaceButton onPress={handleCreateSpace}>
            Create My Safe Space
          </SafeSpaceButton>

          <SafeSpaceButton variant="outline" onPress={handleLogin}>
            Log In
          </SafeSpaceButton>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Footer Disclaimer */}
        <SafeSpaceCaption align="center" style={styles.disclaimer}>
          By continuing, you agree this is a supportive AI coach, not a substitute for professional care.
        </SafeSpaceCaption>
      </View>
    </SafeSpaceScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  title: {
    fontSize: 40,
  },
  subtitle: {
    maxWidth: 400,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    marginTop: 24,
  },
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  disclaimer: {
    maxWidth: 350,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});
