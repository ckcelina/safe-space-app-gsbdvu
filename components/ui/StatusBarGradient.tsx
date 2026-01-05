
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '@/contexts/ThemeContext';
import { StatusBar } from 'expo-status-bar';

/**
 * StatusBarGradient component
 * Renders a gradient background behind the status bar (time, battery, Wi-Fi icons)
 * that matches the selected theme's primary gradient.
 */
export function StatusBarGradient() {
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();

  // Only render on screens where status bar is visible
  if (insets.top === 0) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" translucent />
      <View style={[styles.container, { height: insets.top }]} pointerEvents="none">
        <LinearGradient
          colors={theme.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});
