
import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
 * - Real app icon centered inside
 * - Clean, modern design
 */
export function WidgetImage({ themeKey, size = 120 }: WidgetImageProps) {
  const gradient = themeGradients[themeKey];
  const iconSize = size * 0.6; // Icon is 60% of container size for good visibility

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size * 0.2 }]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.iconContainer}>
          <Image
            source={require('@/assets/icon.png')}
            style={{
              width: iconSize,
              height: iconSize,
              borderRadius: iconSize * 0.15,
            }}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>
    </View>
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
