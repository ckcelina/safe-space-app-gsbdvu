
# Quick Reference: Theme & Logo System

## 🎨 Using Themes

```tsx
import { useThemeContext } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, themeKey, setTheme } = useThemeContext();
  
  return (
    <View style={{ backgroundColor: theme.background }}>
      <Text style={{ color: theme.textPrimary }}>Title</Text>
      <Text style={{ color: theme.textSecondary }}>Subtitle</Text>
    </View>
  );
}
```

### Theme Properties

| Property | Usage |
|----------|-------|
| `theme.primary` | Accent colors, highlights |
| `theme.primaryGradient` | Button gradients, backgrounds |
| `theme.background` | Main screen background |
| `theme.card` | Card/container backgrounds |
| `theme.textPrimary` | Main text |
| `theme.textSecondary` | Muted/helper text |
| `theme.buttonText` | Text on colored backgrounds |

---

## 🖼️ Using the Logo

```tsx
import { SafeSpaceLogo } from '@/components/SafeSpaceLogo';

// Simple logo with theme color
<SafeSpaceLogo size={80} />

// Logo with gradient (like app icon)
<SafeSpaceLogo size={120} useGradient={true} />

// Logo with custom color
<SafeSpaceLogo size={60} color="#FF6B6B" />

// Logo with explicit theme (for previews)
<SafeSpaceLogo size={140} useGradient={true} themeKey="OceanBlue" />
```

---

## 🧭 Navigation Icons (Theme-Aware)

```tsx
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '@/contexts/ThemeContext';

function MyScreen() {
  const { theme } = useThemeContext();
  
  return (
    <View style={styles.header}>
      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.button, { backgroundColor: theme.card }]}
      >
        <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
      </TouchableOpacity>
      
      {/* Settings button */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/settings')}
        style={[styles.button, { backgroundColor: theme.card }]}
      >
        <Ionicons name="settings-outline" size={24} color={theme.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}
```

---

## ✅ Do's and Don'ts

### ✅ DO

- Use `SafeSpaceLogo` for all logo displays
- Use theme colors from `useThemeContext()`
- Make navigation icons theme-aware
- Test UI in all 4 themes

### ❌ DON'T

- Hard-code colors like `#FFFFFF` or `#000000`
- Create custom logo components
- Use `WidgetImage` (deleted)
- Forget to apply theme to new components

---

## 📱 App Icon Status

- **In-app logos**: ✅ Fully theme-aware
- **App icon**: Static (platform limitations)
- **Widget preview**: ✅ Theme-aware

See `THEME_LOGO_DOCUMENTATION.md` for details on platform limitations.

---

## 🔍 Quick Checklist for New Components

- [ ] Import `useThemeContext` hook
- [ ] Use `theme.background` for backgrounds
- [ ] Use `theme.textPrimary` for main text
- [ ] Use `theme.textSecondary` for muted text
- [ ] Use `theme.card` for card backgrounds
- [ ] Use `theme.primary` for accents
- [ ] Use `SafeSpaceLogo` for any logo display
- [ ] Make navigation icons theme-aware
- [ ] Test in all 4 themes

---

## 📚 Full Documentation

For comprehensive documentation, see:
- `THEME_LOGO_DOCUMENTATION.md` - Complete guide
- `THEME_LOGO_FIXES_SUMMARY.md` - Summary of changes
