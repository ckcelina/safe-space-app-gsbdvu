/**
 * App Icon Switcher
 *
 * Handles switching app icons based on selected theme.
 * iOS: Uses alternate icons (requires configuration in app.json)
 * Android: Not supported in managed Expo workflow yet
 *
 * IMPORTANT: This is a graceful implementation that:
 * - Works in Expo Go (logs warning but doesn't crash)
 * - Works in production builds (switches icons if configured)
 * - Provides fallbacks for all edge cases
 */

import { Platform } from 'react-native';
import * as Application from 'expo-application';
import { ThemeKey } from '@/contexts/ThemeContext';
import { getThemeAssets } from '@/constants/ThemeAssets';

/**
 * Switch app icon to match the selected theme
 *
 * iOS: Attempts to switch to alternate icon if available
 * Android: No-op in managed workflow (returns success for compatibility)
 *
 * @param themeKey - The theme to switch to
 * @returns Promise that resolves when icon switch completes (or fails gracefully)
 */
export async function switchAppIcon(themeKey: ThemeKey): Promise<void> {
  // Skip in Expo Go - alternate icons not supported
  if (__DEV__ && !Application.applicationId?.includes('safespace')) {
    console.log('[AppIcon] Skipping icon switch in dev environment');
    return;
  }

  // Android: Not supported in managed workflow
  if (Platform.OS === 'android') {
    console.log('[AppIcon] Android dynamic icons not supported in managed Expo');
    return;
  }

  // iOS: Attempt to switch alternate icon
  if (Platform.OS === 'ios') {
    try {
      const themeAssets = getThemeAssets(themeKey);
      const iconName = themeAssets.iosAlternateIconName;

      // Check if alternate icons are supported
      if (!Application.setAlternateIconNameAsync) {
        console.log('[AppIcon] Alternate icons API not available');
        return;
      }

      // Get current icon name
      const currentIcon = await Application.getAlternateIconNameAsync();

      // Skip if already using this icon
      if (currentIcon === iconName) {
        console.log(`[AppIcon] Already using icon: ${iconName || 'default'}`);
        return;
      }

      // Switch to new icon
      await Application.setAlternateIconNameAsync(iconName);
      console.log(`[AppIcon] Successfully switched to icon: ${iconName || 'default'}`);
    } catch (error) {
      // Graceful failure - log but don't crash
      console.warn('[AppIcon] Failed to switch app icon:', error);

      // Common errors:
      // - Icon not configured in app.json
      // - Icon files missing from bundle
      // - Running in Expo Go (not supported)

      // This is expected and safe to ignore in dev/Expo Go
    }
  }
}

/**
 * Get current app icon name
 *
 * @returns Current alternate icon name, or null for default icon
 */
export async function getCurrentAppIcon(): Promise<string | null> {
  if (Platform.OS !== 'ios') {
    return null;
  }

  try {
    if (!Application.getAlternateIconNameAsync) {
      return null;
    }

    return await Application.getAlternateIconNameAsync();
  } catch (error) {
    console.warn('[AppIcon] Failed to get current icon:', error);
    return null;
  }
}

/**
 * Reset app icon to default
 */
export async function resetAppIcon(): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }

  try {
    if (!Application.setAlternateIconNameAsync) {
      return;
    }

    await Application.setAlternateIconNameAsync(null);
    console.log('[AppIcon] Reset to default icon');
  } catch (error) {
    console.warn('[AppIcon] Failed to reset icon:', error);
  }
}
