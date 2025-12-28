
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeSpaceLogo } from '@/components/SafeSpaceLogo';
import { useThemeContext } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Widget Preview Card
 * 
 * Displays a preview of the Safe Space Home Screen widget
 * with the current theme applied.
 * 
 * This component shows users exactly what their iOS Home Screen widget
 * will look like with their selected theme.
 * 
 * Features:
 * - Accurate representation of actual widget appearance
 * - Shows both small and medium widget sizes
 * - Updates in real-time when theme changes
 * - Platform-specific messaging (iOS only)
 * 
 * This component uses the unified SafeSpaceLogo component
 * to ensure consistency with the actual widget.
 */
export function WidgetPreviewCard() {
  const { theme, themeKey } = useThemeContext();

  if (Platform.OS !== 'ios') {
    return (
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Home Widget Preview
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Home Screen widgets are currently only available on iOS devices
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        Home Widget Preview
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        This is how your Safe Space widget will appear on your iPhone Home Screen
      </Text>
      
      <View style={styles.widgetsContainer}>
        {/* Small Widget Preview */}
        <View style={styles.widgetWrapper}>
          <Text style={[styles.widgetLabel, { color: theme.textSecondary }]}>
            Small
          </Text>
          <View style={[styles.smallWidget, { borderRadius: 20 }]}>
            <LinearGradient
              colors={theme.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.widgetGradient}
            >
              <SafeSpaceLogo size={60} color="#FFFFFF" useGradient={false} />
            </LinearGradient>
          </View>
        </View>

        {/* Medium Widget Preview */}
        <View style={styles.widgetWrapper}>
          <Text style={[styles.widgetLabel, { color: theme.textSecondary }]}>
            Medium
          </Text>
          <View style={[styles.mediumWidget, { borderRadius: 20 }]}>
            <LinearGradient
              colors={theme.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.widgetGradient}
            >
              <SafeSpaceLogo size={80} color="#FFFFFF" useGradient={false} />
              <Text style={styles.widgetTitle}>Safe Space</Text>
              <Text style={styles.widgetSubtitle}>Check in</Text>
            </LinearGradient>
          </View>
        </View>
      </View>

      <Text style={[styles.description, { color: theme.textSecondary }]}>
        The widget updates automatically when you change your theme. Add it to your Home Screen from the widget gallery.
      </Text>
      
      <View style={[styles.infoBox, { backgroundColor: theme.background }]}>
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          💡 To add the widget: Long press your Home Screen → Tap + → Search "Safe Space" → Add Widget
        </Text>
      </View>
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
  widgetsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 20,
    gap: 16,
  },
  widgetWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  widgetLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  smallWidget: {
    width: 140,
    height: 140,
    overflow: 'hidden',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 5,
  },
  mediumWidget: {
    width: 140,
    height: 140,
    overflow: 'hidden',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 5,
  },
  widgetGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  widgetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  widgetSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  infoBox: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    width: '100%',
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
