
# Safe Space - Theme & Logo System Documentation

## Overview

This document describes the unified theme and logo system implemented in Safe Space. All components use a single source of truth for branding and theming to ensure consistency across the entire app.

---

## 1. Logo System

### Single Source of Truth: `SafeSpaceLogo` Component

**Location:** `components/SafeSpaceLogo.tsx`

The `SafeSpaceLogo` component is the **ONLY** logo component used throughout the app. It replaces all previous logo implementations including `WidgetImage.tsx`.

### Logo Features

- **Theme-aware coloring**: Automatically matches the active theme
- **Gradient support**: Can display with or without gradient background
- **Responsive sizing**: Adapts to different screen sizes
- **Consistent design**: Same icon used everywhere (app icon, widget, onboarding, empty states)

### Logo Icon Design

The logo features a **heart inside a speech bubble**, representing:
- **Speech bubble**: Communication and conversation
- **Heart**: Care, empathy, and emotional support

### Usage Examples

```tsx
import { SafeSpaceLogo } from '@/components/SafeSpaceLogo';

// Simple logo with theme color
<SafeSpaceLogo size={80} />

// Logo with gradient background (like app icon/widget)
<SafeSpaceLogo size={120} useGradient={true} />

// Logo with custom color override
<SafeSpaceLogo size={60} color="#FF6B6B" />

// Logo with explicit theme (for previews)
<SafeSpaceLogo size={140} useGradient={true} themeKey="OceanBlue" />
```

### Where the Logo is Used

1. **Onboarding screen** - Large gradient logo
2. **Home screen** - Empty state icon
3. **Settings screen** - Widget preview
4. **Error states** - Branded error messages
5. **Loading states** - Branded loading indicators

---

## 2. Theme System

### Theme Context

**Location:** `contexts/ThemeContext.tsx`

The theme system provides consistent colors, gradients, and styling across all screens.

### Available Themes

1. **Ocean Blue** - Calm and serene
2. **Soft Rose** - Gentle and nurturing
3. **Forest Green** - Grounded and peaceful
4. **Sunny Yellow** - Bright and uplifting

### Theme Properties

Each theme includes:

```typescript
interface Theme {
  primary: string;              // Primary brand color
  primaryGradient: [string, string]; // Gradient for buttons/backgrounds
  background: string;           // Main background color
  card: string;                 // Card/container background
  textPrimary: string;          // Primary text color
  textSecondary: string;        // Secondary/muted text color
  buttonText: string;           // Text color on buttons
  statusBarGradient: [string, string]; // Light gradient for status bar
}
```

### Using Themes in Components

```tsx
import { useThemeContext } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, themeKey, setTheme } = useThemeContext();
  
  return (
    <View style={{ backgroundColor: theme.background }}>
      <Text style={{ color: theme.textPrimary }}>Hello</Text>
      <TouchableOpacity 
        style={{ backgroundColor: theme.primary }}
        onPress={() => setTheme('SoftRose')}
      >
        <Text style={{ color: theme.buttonText }}>Change Theme</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Theme Consistency Rules

✅ **DO:**
- Use `theme.textPrimary` for main text
- Use `theme.textSecondary` for muted/helper text
- Use `theme.primary` for accent colors
- Use `theme.card` for card backgrounds
- Use `theme.buttonText` for text on colored backgrounds
- Use `theme.primaryGradient` for gradient buttons/backgrounds

❌ **DON'T:**
- Hard-code colors like `#FFFFFF` or `#000000`
- Use colors that don't adapt to theme changes
- Create custom color schemes outside the theme system

---

## 3. App Icon Behavior

### Current Implementation

The app currently uses **static app icons** defined in `app.json`:

```json
{
  "icon": "./assets/images/b74402c4-5458-43d3-8d1e-b0a3c26a1e4e.jpeg",
  "ios": {
    "icon": "./assets/images/b74402c4-5458-43d3-8d1e-b0a3c26a1e4e.jpeg"
  },
  "android": {
    "icon": "./assets/images/b74402c4-5458-43d3-8d1e-b0a3c26a1e4e.jpeg",
    "adaptiveIcon": {
      "foregroundImage": "./assets/images/b74402c4-5458-43d3-8d1e-b0a3c26a1e4e.jpeg",
      "backgroundColor": "#4A90E2"
    }
  }
}
```

### Platform Limitations

#### iOS
- **Alternate App Icons**: iOS supports programmatic app icon switching via `setAlternateIconName`
- **Limitation**: Requires pre-defined icon assets in the app bundle
- **User Experience**: Shows a system alert when changing icons
- **Implementation Status**: Not currently implemented (would require 4 icon sets for each theme)

#### Android
- **Adaptive Icons**: Android supports adaptive icons with foreground + background
- **Limitation**: Icon must be defined at build time
- **Dynamic Theming**: Android 12+ supports Material You dynamic colors, but not for app icons
- **Implementation Status**: Using adaptive icon with static blue background

### In-App Logo Behavior

While the **app icon** remains static, all **in-app logos** automatically recolor based on the active theme:

✅ **Theme-aware in-app logos:**
- Onboarding screen logo
- Widget preview in settings
- Empty state icons
- Error state icons
- All `SafeSpaceLogo` instances

### Future Enhancements

To implement dynamic app icons:

1. **iOS**: 
   - Create 4 icon sets (one per theme) in `ios/` directory
   - Use `expo-alternate-app-icons` or native module
   - Call `setAlternateIconName()` when theme changes

2. **Android**:
   - Create 4 activity aliases with different icons
   - Enable/disable aliases programmatically when theme changes
   - Requires app restart to take effect

**Note:** Dynamic app icons are **not critical** for the user experience since in-app branding is already theme-aware.

---

## 4. Navigation Icons

### Topic/Subject Pages

All topic and subject detail pages include:

1. **Back button** (top-left)
   - Theme-aware background: `theme.card`
   - Theme-aware icon color: `theme.textPrimary`
   - Always visible and tappable

2. **Settings button** (top-right)
   - Theme-aware background: `theme.card`
   - Theme-aware icon color: `theme.textPrimary`
   - Navigates to settings screen

3. **Save/Heart button** (top-right)
   - Theme-aware background: `theme.card`
   - Icon color: Red when saved, `theme.textPrimary` when not saved
   - Toggles save status with haptic feedback

### Implementation Example

```tsx
<View style={styles.header}>
  <TouchableOpacity
    onPress={() => router.back()}
    style={[styles.backButton, { backgroundColor: theme.card }]}
  >
    <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
  </TouchableOpacity>
  
  <View style={styles.headerRight}>
    <TouchableOpacity
      onPress={toggleSave}
      style={[styles.heartButton, { backgroundColor: theme.card }]}
    >
      <Ionicons
        name={isSaved ? 'heart' : 'heart-outline'}
        size={24}
        color={isSaved ? '#FF6B6B' : theme.textPrimary}
      />
    </TouchableOpacity>

    <TouchableOpacity
      onPress={() => router.push('/(tabs)/settings')}
      style={[styles.settingsButton, { backgroundColor: theme.card }]}
    >
      <Ionicons name="settings-outline" size={24} color={theme.textPrimary} />
    </TouchableOpacity>
  </View>
</View>
```

---

## 5. Testing Checklist

### Theme Consistency

- [ ] All screens use theme colors (no hard-coded colors)
- [ ] Text is readable in all themes
- [ ] Buttons have proper contrast in all themes
- [ ] Navigation icons are visible in all themes
- [ ] Gradients match the selected theme

### Logo Consistency

- [ ] All logos use `SafeSpaceLogo` component
- [ ] No instances of `WidgetImage` or custom logo implementations
- [ ] Logo recolors correctly when theme changes
- [ ] Logo displays correctly at all sizes
- [ ] Gradient logos match theme gradient

### Navigation

- [ ] All topic pages have back buttons
- [ ] All topic pages have settings buttons (where applicable)
- [ ] All navigation icons are theme-aware
- [ ] All buttons are tappable and responsive

---

## 6. Migration Guide

### Replacing Old Logo Components

If you find any old logo implementations:

**Before:**
```tsx
import { WidgetImage } from '@/components/WidgetImage';

<WidgetImage themeKey={themeKey} size={120} />
```

**After:**
```tsx
import { SafeSpaceLogo } from '@/components/SafeSpaceLogo';

<SafeSpaceLogo size={120} useGradient={true} />
```

### Adding Theme Support to New Components

**Before:**
```tsx
<View style={{ backgroundColor: '#FFFFFF' }}>
  <Text style={{ color: '#000000' }}>Hello</Text>
</View>
```

**After:**
```tsx
import { useThemeContext } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme } = useThemeContext();
  
  return (
    <View style={{ backgroundColor: theme.card }}>
      <Text style={{ color: theme.textPrimary }}>Hello</Text>
    </View>
  );
}
```

---

## 7. Summary

### ✅ Completed

1. **Unified logo component** - `SafeSpaceLogo` is the single source of truth
2. **Theme consistency** - All screens use theme colors
3. **Navigation icons** - All topic pages have back and settings buttons
4. **Theme-aware icons** - All navigation icons adapt to theme
5. **Documentation** - Comprehensive guide for developers

### 📝 Platform Limitations

1. **App icon** - Remains static due to platform limitations
2. **iOS alternate icons** - Requires additional setup and icon assets
3. **Android dynamic icons** - Requires activity aliases and app restart

### 🎯 Key Takeaways

- **Always use `SafeSpaceLogo`** for any logo display
- **Always use theme colors** from `useThemeContext()`
- **Never hard-code colors** - use theme properties
- **Test all themes** when adding new UI components
- **In-app logos are theme-aware** even though app icon is static

---

## Contact

For questions or issues related to theming and branding, refer to this documentation or check the implementation in:
- `components/SafeSpaceLogo.tsx`
- `contexts/ThemeContext.tsx`
- `app/(tabs)/library/detail.tsx` (example of proper navigation icons)
