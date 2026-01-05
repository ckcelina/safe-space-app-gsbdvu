# Safe Space Theme-Based Branding Setup

Complete guide for configuring theme-based branding across the app.

## Overview

Users can select a theme color in Settings. The selected theme is reflected across:
- ✅ In-app logo and UI colors
- ✅ Status bar styling
- ✅ Safe area backgrounds
- ✅ App icon (iOS alternate icons - requires configuration)
- ⏳ Splash screen (future enhancement)

## Architecture

### Single Source of Truth

All theme assets are defined in `constants/ThemeAssets.ts`:

```typescript
export const ThemeAssetsMap: Record<ThemeKey, ThemeAssets> = {
  OceanBlue: { ... },
  SoftRose: { ... },
  ForestGreen: { ... },
  SunnyYellow: { ... }
}
```

### Theme Persistence

- Themes are saved to AsyncStorage (`@safe_space_theme_v2`)
- Loaded on app launch before UI renders
- Persists across app restarts

### Components

**ThemeContext** (`contexts/ThemeContext.tsx`)
- Manages current theme state
- Persists theme selection
- Switches app icon when theme changes

**appIconSwitcher** (`utils/appIconSwitcher.ts`)
- Handles iOS alternate icon switching
- Gracefully degrades in Expo Go
- Safe fallbacks for all edge cases

## iOS Alternate Icons Setup

### 1. Prepare Icon Assets

Create app icons for each theme (1024x1024 PNG):
- `icon-ocean-blue.png`
- `icon-soft-rose.png`
- `icon-forest-green.png`
- `icon-sunny-yellow.png`

Place in `/assets/images/app-icons/`

### 2. Configure app.json

Add alternate icons configuration:

```json
{
  "expo": {
    "ios": {
      "icon": "./assets/images/app-icons/icon-ocean-blue.png",
      "alternateIcons": {
        "OceanBlue": {
          "image": "./assets/images/app-icons/icon-ocean-blue.png",
          "prerendered": true
        },
        "SoftRose": {
          "image": "./assets/images/app-icons/icon-soft-rose.png",
          "prerendered": true
        },
        "ForestGreen": {
          "image": "./assets/images/app-icons/icon-forest-green.png",
          "prerendered": true
        },
        "SunnyYellow": {
          "image": "./assets/images/app-icons/icon-sunny-yellow.png",
          "prerendered": true
        }
      }
    }
  }
}
```

### 3. Build and Test

**Important**: Alternate icons do NOT work in Expo Go.

```bash
# Build development client
eas build --platform ios --profile development

# Or create production build
eas build --platform ios --profile production
```

Install the build on a physical device and test theme switching in Settings.

### 4. Verify Icon Switching

1. Open app
2. Go to Settings → Theme Selection
3. Select different themes
4. Check that home screen icon changes (may take a few seconds)
5. Verify icon persists after app restart

## Android Icon Behavior

Android dynamic icons are **not supported** in Expo managed workflow.

Current behavior:
- Uses primary app icon (defined in `app.json`)
- In-app branding (logo, colors, UI) fully reflects selected theme
- Icon switching gracefully skips on Android (no errors)

Future: If moving to bare workflow or using EAS Build with native config, Android Adaptive Icons can be configured.

## Status Bar + Safe Area

### Current Implementation

**StatusBarGradient** component (`components/ui/StatusBarGradient.tsx`):
- Renders gradient behind status bar (time/battery/Wi-Fi)
- Matches selected theme's primary gradient
- Only visible when safe area insets > 0

**SafeSpaceScreen** component (`components/ui/SafeSpaceScreen.tsx`):
- Applies theme background gradient
- Extends into top safe area (no white strip on iOS)
- `useGradient` prop controls gradient vs solid background

### Configuration

Status bar style is set to `light` globally for all themes:

```typescript
// constants/ThemeAssets.ts
statusBarStyle: 'light' // White text on colored backgrounds
```

To use dark status bar for light themes:

```typescript
OceanBlue: {
  statusBarStyle: 'dark', // Dark text for light backgrounds
  // ...
}
```

Then update `StatusBarGradient.tsx` to use dynamic style:

```typescript
import { getThemeAssets } from '@/constants/ThemeAssets';

const themeAssets = getThemeAssets(themeKey);
<StatusBar style={themeAssets.statusBarStyle} />
```

## Splash Screen (Future)

Dynamic splash screens per theme are **not supported** in managed Expo workflow.

Current approach:
- Use neutral Safe Space splash (white/blue)
- First screen after splash immediately shows theme branding
- No visible flicker due to fast theme load from AsyncStorage

If dynamic splash is critical:
- Move to bare workflow
- Configure native splash screens per platform
- Use `expo-splash-screen` with custom native modules

## Testing Checklist

### In Expo Go (Development)

- [ ] Theme selection persists across app restarts
- [ ] Logo colors update instantly when theme changes
- [ ] Status bar gradient matches theme
- [ ] Safe area background extends behind status bar
- [ ] No crashes when switching themes rapidly
- [ ] Console shows `[AppIcon] Skipping icon switch in dev environment`

### In Production Build (iOS)

- [ ] All above checks pass
- [ ] App icon changes when theme is selected
- [ ] Icon change persists after closing app
- [ ] Icon matches selected theme on home screen
- [ ] No alert dialogs about icon changes (iOS shows system alert, this is normal)

### In Production Build (Android)

- [ ] All Expo Go checks pass
- [ ] No crashes related to icon switching
- [ ] Console shows `[AppIcon] Android dynamic icons not supported`

## Troubleshooting

### iOS Icon Not Changing

**Problem**: Selected theme but app icon didn't change

**Solutions**:
1. Verify you're using a production/development build (NOT Expo Go)
2. Check `app.json` has correct `alternateIcons` configuration
3. Verify icon files exist at specified paths
4. Check console for errors: `[AppIcon] Failed to switch app icon`
5. Try force-quitting app and reopening
6. Verify icons were bundled: check app bundle in Xcode

### Icon Files Not Found

**Problem**: Build fails or icons missing

**Solutions**:
1. Verify icon files are in `/assets/images/app-icons/`
2. Check file names match exactly (case-sensitive)
3. Ensure icons are 1024x1024 PNG
4. Run `eas build` with `--clear-cache`

### Theme Not Persisting

**Problem**: Theme resets to OceanBlue on app restart

**Solutions**:
1. Check AsyncStorage permissions
2. Verify `THEME_STORAGE_KEY` is consistent
3. Check console for `Error loading theme` or `Error saving theme`
4. Clear app data and try again

### Status Bar Shows Wrong Color

**Problem**: Status bar doesn't match theme

**Solutions**:
1. Verify `StatusBarGradient` component is rendered
2. Check `showStatusBarGradient` prop is true
3. Verify theme gradients are defined correctly
4. Check safe area insets are > 0 (component hides if insets === 0)

## Adding New Themes

To add a new theme (e.g., "MidnightPurple"):

### 1. Update ThemeKey Type

```typescript
// contexts/ThemeContext.tsx
export type ThemeKey = 'OceanBlue' | 'SoftRose' | 'ForestGreen' | 'SunnyYellow' | 'MidnightPurple';
```

### 2. Define Theme Colors

```typescript
// contexts/ThemeContext.tsx
const midnightPurpleTheme: Theme = {
  primary: '#6B46C1',
  primaryGradient: ['#6B46C1', '#9F7AEA'],
  background: '#F3F0FF',
  card: '#FFFFFF',
  textPrimary: '#2D1B4E',
  textSecondary: '#6B5B95',
  buttonText: '#FFFFFF',
  statusBarGradient: ['#F9F7FF', '#F3F0FF'],
};

const themes: Record<ThemeKey, Theme> = {
  // ... existing themes
  MidnightPurple: midnightPurpleTheme,
};
```

### 3. Add Theme Assets

```typescript
// constants/ThemeAssets.ts
export const ThemeAssetsMap: Record<ThemeKey, ThemeAssets> = {
  // ... existing themes
  MidnightPurple: {
    primaryGradient: ['#6B46C1', '#9F7AEA'],
    statusBarStyle: 'light',
    iosAlternateIconName: 'MidnightPurple',
    androidIconName: null,
    logoGradient: ['#6B46C1', '#9F7AEA'],
    backgroundColor: '#F3F0FF',
    cardColor: '#FFFFFF',
    statusBarGradient: ['#F9F7FF', '#F3F0FF'],
  },
};
```

### 4. Add App Icon

Create `icon-midnight-purple.png` (1024x1024) and add to `app.json`:

```json
{
  "expo": {
    "ios": {
      "alternateIcons": {
        "MidnightPurple": {
          "image": "./assets/images/app-icons/icon-midnight-purple.png",
          "prerendered": true
        }
      }
    }
  }
}
```

### 5. Update Theme Selection UI

Add new theme option in Settings screen theme selector.

## Best Practices

✅ **DO:**
- Test in production builds for icon switching
- Provide fallbacks for all theme values
- Keep theme assets centralized in ThemeAssets.ts
- Use semantic theme names (OceanBlue, not Blue1)
- Ensure sufficient color contrast for accessibility

❌ **DON'T:**
- Hardcode theme colors in components
- Assume alternate icons work in Expo Go
- Change theme storage key without migration
- Remove fallbacks from LinearGradient colors
- Test only in Expo Go (icons won't work)

## Support

For issues:
1. Check console logs for `[AppIcon]` and `[Theme]` messages
2. Verify theme persistence with AsyncStorage debugger
3. Test in production build, not Expo Go
4. Check this documentation's troubleshooting section

For feature requests or bugs, see project README.
