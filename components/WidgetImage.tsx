
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { ThemeKey } from '@/contexts/ThemeContext';

interface WidgetImageProps {
  themeKey: ThemeKey;
  size?: number;
}

const themeGradients: Record<ThemeKey, [string, string]> = {
  OceanBlue: ['#1890FF', '#40A9FF'],
  SoftRose: ['#FF69B4', '#FFB6C1'],
  ForestGreen: ['#228B22', '#90EE90'],
  SunnyYellow: ['#F59E0B', '#FDE68A'],
};

/**
 * Widget Image Component
 * 
 * A reusable visual asset for Safe Space that can be used as:
 * - App icon preview
 * - Widget preview
 * - Branding element
 * 
 * Features:
 * - Rounded square shape
 * - Theme-aware gradient background
 * - Minimal line-art icon (heart inside speech bubble)
 * - Clean, modern design
 */
export function WidgetImage({ themeKey, size = 120 }: WidgetImageProps) {
  const gradient = themeGradients[themeKey];
  const iconSize = size * 0.5; // Icon is 50% of container size

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size * 0.2 }]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.iconContainer}>
          <HeartBubbleIcon size={iconSize} />
        </View>
      </LinearGradient>
    </View>
  );
}

/**
 * Heart inside Speech Bubble Icon
 * 
 * A minimal line-art icon representing:
 * - Speech bubble: Communication and conversation
 * - Heart: Care, empathy, and emotional support
 * 
 * Perfect for Safe Space's mission of providing a supportive space for conversations.
 */
function HeartBubbleIcon({ size }: { size: number }) {
  const strokeWidth = size * 0.04; // 4% of size for clean lines
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
        stroke="#FFFFFF"
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
        stroke="#FFFFFF"
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
        stroke="#FFFFFF"
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
        stroke="#FFFFFF"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Small decorative dots for extra detail */}
      <Circle cx="35" cy="30" r={strokeWidth * 0.8} fill="#FFFFFF" opacity={0.6} />
      <Circle cx="65" cy="30" r={strokeWidth * 0.8} fill="#FFFFFF" opacity={0.6} />
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
