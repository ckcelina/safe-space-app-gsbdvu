
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from './IconSymbol';

interface WidgetImageProps {
  themeKey: 'OceanBlue' | 'SoftRose' | 'ForestGreen';
}

const themeGradients = {
  OceanBlue: ['#3A6FF8', '#6AB7FF'],
  SoftRose: ['#E87AA6', '#F5B3CE'],
  ForestGreen: ['#4DA768', '#8BD9A5'],
};

/**
 * Widget Image Component
 * 
 * This component renders a theme-based app widget image.
 * It displays a gradient background with a centered shield icon.
 * 
 * Note: Since we cannot generate actual PNG files in this environment,
 * this component can be used to:
 * 1. Display the widget preview in the app
 * 2. Be screenshot/exported manually for use as app icon
 * 3. Be rendered server-side to generate actual image files
 * 
 * For production use, you would typically:
 * - Use a design tool (Figma, Sketch) to create the actual PNG files
 * - Or use a server-side image generation library
 * - Or use expo-asset to bundle pre-made images
 */
export function WidgetImage({ themeKey }: WidgetImageProps) {
  const gradient = themeGradients[themeKey];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.iconContainer}>
          <IconSymbol
            ios_icon_name="shield.fill"
            android_material_icon_name="shield"
            size={120}
            color="#FFFFFF"
          />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    borderRadius: 40,
    overflow: 'hidden',
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.2)',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
