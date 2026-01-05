/**
 * Theme Assets Configuration
 *
 * Single source of truth for all theme-related branding assets.
 * Maps each theme to its specific visual assets and configurations.
 *
 * Used by:
 * - App icon switching (iOS alternate icons)
 * - Logo display across all screens
 * - Status bar styling
 * - Safe area backgrounds
 * - Splash screen theming
 */

import { ThemeKey } from '@/contexts/ThemeContext';

export interface ThemeAssets {
  // Visual branding
  primaryGradient: [string, string];
  statusBarStyle: 'light' | 'dark';

  // App icon (iOS alternate icons)
  // For managed Expo: these map to alternate icons configured in app.json
  // If null, uses default icon
  iosAlternateIconName: string | null;

  // Android icon (future: dynamic icons if supported)
  androidIconName: string | null;

  // Logo colors (used by SafeSpaceLogo component)
  logoGradient: [string, string];

  // Background colors for splash/safe areas
  backgroundColor: string;
  cardColor: string;

  // Status bar gradient (light overlay behind system UI)
  statusBarGradient: [string, string];
}

/**
 * Theme Assets Map
 *
 * Maps each ThemeKey to its complete asset configuration.
 * Add new themes here to enable full branding support.
 */
export const ThemeAssetsMap: Record<ThemeKey, ThemeAssets> = {
  OceanBlue: {
    primaryGradient: ['#0050B3', '#40A9FF'],
    statusBarStyle: 'light',
    iosAlternateIconName: 'OceanBlue', // Maps to app.json alternate icon
    androidIconName: null, // Not supported in managed workflow yet
    logoGradient: ['#1890FF', '#40A9FF'],
    backgroundColor: '#E6F7FF',
    cardColor: '#FFFFFF',
    statusBarGradient: ['#F0F9FF', '#E6F7FF'],
  },

  SoftRose: {
    primaryGradient: ['#FF69B4', '#FFB6C1'],
    statusBarStyle: 'light',
    iosAlternateIconName: 'SoftRose',
    androidIconName: null,
    logoGradient: ['#FF69B4', '#FFB6C1'],
    backgroundColor: '#FFF0F5',
    cardColor: '#FFFFFF',
    statusBarGradient: ['#FFF5F9', '#FFF0F5'],
  },

  ForestGreen: {
    primaryGradient: ['#228B22', '#90EE90'],
    statusBarStyle: 'light',
    iosAlternateIconName: 'ForestGreen',
    androidIconName: null,
    logoGradient: ['#228B22', '#90EE90'],
    backgroundColor: '#F0F8F0',
    cardColor: '#FFFFFF',
    statusBarGradient: ['#F5FBF5', '#F0F8F0'],
  },

  SunnyYellow: {
    primaryGradient: ['#F59E0B', '#FDE68A'],
    statusBarStyle: 'light',
    iosAlternateIconName: 'SunnyYellow',
    androidIconName: null,
    logoGradient: ['#F59E0B', '#FDE68A'],
    backgroundColor: '#FFFBEA',
    cardColor: '#FFFFFF',
    statusBarGradient: ['#FFFEF5', '#FFFBEA'],
  },
};

/**
 * Get theme assets for a given theme key
 *
 * @param themeKey - The theme to get assets for
 * @returns ThemeAssets configuration with fallback to OceanBlue
 */
export function getThemeAssets(themeKey: ThemeKey): ThemeAssets {
  return ThemeAssetsMap[themeKey] || ThemeAssetsMap.OceanBlue;
}

/**
 * Get default theme assets (OceanBlue)
 * Used as fallback when theme is not yet loaded
 */
export function getDefaultThemeAssets(): ThemeAssets {
  return ThemeAssetsMap.OceanBlue;
}
