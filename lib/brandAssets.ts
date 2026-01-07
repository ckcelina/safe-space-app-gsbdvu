
/**
 * Theme-aware brand assets
 * 
 * OS-level app icon switching is not supported in Expo Go. 
 * Theme icons are in-app only.
 * 
 * This is the SINGLE SOURCE OF TRUTH for all theme-based branding assets.
 * All in-app icons, logos, and widget previews should use this mapping.
 */

export type ThemeKey = "ocean" | "rose" | "forest" | "custom";

export interface ThemeBrandAssets {
  appIconInApp: any;
  widgetPreview: any;
  logoMark?: any;
  fallback: any;
}

/**
 * Get theme-specific brand assets
 * 
 * Returns the appropriate logo/icon assets for the given theme.
 * Currently all themes use the same Safe Space gradient logo,
 * but this structure allows for theme-specific assets in the future.
 * 
 * @param themeKey - The theme identifier ('ocean', 'rose', 'forest', 'custom')
 * @returns ThemeBrandAssets object with all brand asset references
 */
export function getThemeBrandAssets(themeKey: ThemeKey): ThemeBrandAssets {
  const themeAssets: Record<ThemeKey, ThemeBrandAssets> = {
    ocean: {
      appIconInApp: require("@/assets/images/safe-space-logo-gradient.png"),
      widgetPreview: require("@/assets/images/safe-space-logo-gradient.png"),
      fallback: require("@/assets/images/safe-space-logo-gradient.png"),
    },
    rose: {
      appIconInApp: require("@/assets/images/safe-space-logo-gradient.png"),
      widgetPreview: require("@/assets/images/safe-space-logo-gradient.png"),
      fallback: require("@/assets/images/safe-space-logo-gradient.png"),
    },
    forest: {
      appIconInApp: require("@/assets/images/safe-space-logo-gradient.png"),
      widgetPreview: require("@/assets/images/safe-space-logo-gradient.png"),
      fallback: require("@/assets/images/safe-space-logo-gradient.png"),
    },
    custom: {
      appIconInApp: require("@/assets/images/safe-space-logo-gradient.png"),
      widgetPreview: require("@/assets/images/safe-space-logo-gradient.png"),
      fallback: require("@/assets/images/safe-space-logo-gradient.png"),
    },
  };

  // Fallback to ocean theme if invalid theme key provided
  return themeAssets[themeKey] || themeAssets.ocean;
}
