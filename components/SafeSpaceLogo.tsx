
import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface SafeSpaceLogoProps {
  size?: number;
  color?: string;
}

/**
 * Safe Space Logo Component
 * 
 * Displays the Safe Space app icon as the universal brand logo.
 * This component uses the actual app icon file to ensure consistent branding
 * across the entire application.
 * 
 * The color prop is kept for API compatibility but is not applied to preserve
 * the original app icon design. If theme tinting is needed in the future,
 * it can be applied via the tintColor style property.
 */
export function SafeSpaceLogo({ size = 64, color }: SafeSpaceLogoProps) {
  return (
    <Image
      source={require('../assets/images/b74402c4-5458-43d3-8d1e-b0a3c26a1e4e.jpeg')}
      style={[
        styles.logo,
        {
          width: size,
          height: size,
        },
      ]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    // Keep aspect ratio and ensure clean rendering
  },
});
