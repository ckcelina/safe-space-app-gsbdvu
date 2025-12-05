
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '@/contexts/ThemeContext';

/**
 * StatusBarGradient component
 * Renders a gradient background behind the status bar (time, battery, Wi-Fi icons)
 * that matches the selected theme.
 */
export function StatusBarGradient() {
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();

  // Only render on screens where status bar is visible
  if (insets.top === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { height: insets.top }]} pointerEvents="none">
      <LinearGradient
        colors={theme.statusBarGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
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
