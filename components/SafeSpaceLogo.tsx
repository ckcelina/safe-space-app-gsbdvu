
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useThemeContext, ThemeKey } from '@/contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SafeSpaceLogoProps {
  size?: number;
  color?: string;
  useGradient?: boolean;
}

const themeGradients: Record<ThemeKey, [string, string]> = {
  OceanBlue: ['#1890FF', '#40A9FF'],
  SoftRose: ['#FF69B4', '#FFB6C1'],
  ForestGreen: ['#228B22', '#90EE90'],
  SunnyYellow: ['#F59E0B', '#FDE68A'],
};

/**
 * Safe Space Logo Component
 * 
 * The official Safe Space logo used throughout the app.
 * Uses the same "Heart inside Speech Bubble" icon as the app icon and widget.
 * 
 * Features:
 * - Theme-aware coloring (automatically matches selected theme)
 * - Optional gradient background (like the widget/app icon)
 * - Consistent design across all screens
 * - Responsive sizing based on screen width
 * 
 * Props:
 * - size: Size of the logo (default: responsive based on screen width)
 * - color: Override color (if not provided, uses theme primary color)
 * - useGradient: Whether to show gradient background like widget (default: false)
 */
export function SafeSpaceLogo({ size, color, useGradient = false }: SafeSpaceLogoProps) {
  const { theme, themeKey } = useThemeContext();
  
  // Responsive sizing: default to 10% of screen width, clamped between 48 and 120
  const responsiveSize = size || Math.min(Math.max(SCREEN_WIDTH * 0.1, 48), 120);
  
  const finalColor = color || theme.primary;
  const gradient = themeGradients[themeKey];
  const iconSize = responsiveSize * 0.6; // Icon is 60% of container size

  if (useGradient) {
    // Render with gradient background (like widget/app icon)
    return (
      <View style={[styles.container, { width: responsiveSize, height: responsiveSize, borderRadius: responsiveSize * 0.2 }]}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.iconContainer}>
            <HeartBubbleIcon size={iconSize} color="#FFFFFF" />
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Render icon only with theme color
  return <HeartBubbleIcon size={responsiveSize} color={finalColor} />;
}

/**
 * Heart inside Speech Bubble Icon
 * 
 * The core Safe Space logo icon representing:
 * - Speech bubble: Communication and conversation
 * - Heart: Care, empathy, and emotional support
 * 
 * This is the same icon used in:
 * - App icon
 * - Widget preview
 * - Onboarding screen
 * - Empty states
 * - Error states
 * 
 * The icon scales responsively based on the size prop.
 */
function HeartBubbleIcon({ size, color = '#FFFFFF' }: { size: number; color?: string }) {
  const strokeWidth = Math.max(size * 0.04, 2); // 4% of size, minimum 2px for visibility
  const viewBox = 100; // Use 100x100 viewBox for easy calculations

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${viewBox} ${viewBox}`}>
      {/* Speech Bubble Outline */}
      <Path
        d="M 20 25 
           Q 20 15, 30 15 
           L 70 15 
           Q 80 15, 80 25 
           L 80 55 
           Q 80 65, 70 65 
           L 55 65 
           L 50 75 
           L 45 65 
           L 30 65 
           Q 20 65, 20 55 
           Z"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Heart Shape inside bubble */}
      <Path
        d="M 50 55 
           C 50 55, 45 50, 45 45 
           C 45 40, 48 38, 50 38 
           C 52 38, 55 40, 55 45 
           C 55 50, 50 55, 50 55 
           Z"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Left heart curve */}
      <Path
        d="M 45 45 
           C 45 42, 43 40, 41 40 
           C 39 40, 37 42, 37 45 
           C 37 47, 39 49, 41 50"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right heart curve */}
      <Path
        d="M 55 45 
           C 55 42, 57 40, 59 40 
           C 61 40, 63 42, 63 45 
           C 63 47, 61 49, 59 50"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Small decorative dots for extra detail */}
      <Circle cx="35" cy="30" r={Math.max(strokeWidth * 0.8, 1)} fill={color} opacity={0.6} />
      <Circle cx="65" cy="30" r={Math.max(strokeWidth * 0.8, 1)} fill={color} opacity={0.6} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
    elevation: 8,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
