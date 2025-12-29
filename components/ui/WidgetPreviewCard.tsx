
import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeSpaceLogo } from '@/components/SafeSpaceLogo';
import { useThemeContext } from '@/contexts/ThemeContext';

/**
 * Widget Preview Card
 * 
 * Displays a preview of the Safe Space app icon/widget
 * with the current theme applied dynamically.
 * 
 * This component uses the unified SafeSpaceLogo component
 * to ensure consistency across all logo displays.
 * 
 * Features:
 * - Instantly updates when theme changes (no reload required)
 * - Responsive sizing based on screen dimensions
 * - Theme-aware colors for background, text, and widget
 * - Consistent with current design language
 * 
 * This component can be used to:
 * - Show users what their home screen widget will look like
 * - Preview the app icon with different themes
 * - Demonstrate the visual identity of Safe Space
 */
export function WidgetPreviewCard() {
  const { theme, themeKey } = useThemeContext();
  const { width: windowWidth } = useWindowDimensions();

  // Responsive widget size: scale between 140-200 based on screen width
  // Clamp to ensure it looks good on all devices
  const widgetSize = Math.min(Math.max(windowWidth * 0.35, 140), 200);

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        Home Widget Preview
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        This is how your Safe Space widget will appear on your home screen
      </Text>
      
      <View style={styles.widgetContainer}>
        <SafeSpaceLogo 
          size={widgetSize} 
          useGradient={true} 
          themeKey={themeKey}
        />
      </View>

      <Text style={[styles.description, { color: theme.textSecondary }]}>
        The widget design updates automatically when you change your theme
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  widgetContainer: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 16,
  },
});
