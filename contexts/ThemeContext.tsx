
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeKey = 'ocean' | 'rose' | 'forest' | 'custom';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  muted: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
}

export interface Theme {
  key: ThemeKey;
  name: string;
  colors: ThemeColors;
}

// Default theme - always available as fallback
export const defaultTheme: Theme = {
  key: 'ocean',
  name: 'Ocean Blue',
  colors: {
    primary: '#007AFF',
    secondary: '#5AC8FA',
    background: '#F2F2F7',
    card: '#FFFFFF',
    text: '#000000',
    border: '#C6C6C8',
    muted: '#8E8E93',
    accent: '#0A84FF',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
  },
};

const themes: Record<ThemeKey, Theme> = {
  ocean: defaultTheme,
  rose: {
    key: 'rose',
    name: 'Soft Rose',
    colors: {
      primary: '#FF6B9D',
      secondary: '#FFA8C5',
      background: '#FFF5F7',
      card: '#FFFFFF',
      text: '#2C2C2E',
      border: '#FFD4E5',
      muted: '#C7A3B3',
      accent: '#FF85A8',
      success: '#34C759',
      warning: '#FF9500',
      error: '#FF3B30',
    },
  },
  forest: {
    key: 'forest',
    name: 'Forest Green',
    colors: {
      primary: '#34C759',
      secondary: '#30D158',
      background: '#F0F9F4',
      card: '#FFFFFF',
      text: '#1C1C1E',
      border: '#C6E5D1',
      muted: '#8E9E93',
      accent: '#32D74B',
      success: '#34C759',
      warning: '#FF9500',
      error: '#FF3B30',
    },
  },
  custom: defaultTheme, // Fallback to ocean for custom
};

interface ThemeContextType {
  theme: Theme;
  themeKey: ThemeKey;
  setTheme: (key: ThemeKey) => Promise<void>;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@safe_space_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>('ocean');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && themes[savedTheme as ThemeKey]) {
        setThemeKey(savedTheme as ThemeKey);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (key: ThemeKey) => {
    try {
      setThemeKey(key);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, key);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const currentTheme = themes[themeKey] || defaultTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        themeKey,
        setTheme,
        colors: currentTheme.colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * ALWAYS returns a valid theme object, never undefined
 * Safe to use anywhere in the app
 */
export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  // If context is not available (provider not mounted yet), return safe default
  if (!context) {
    return {
      theme: defaultTheme,
      themeKey: 'ocean',
      setTheme: async () => {},
      colors: defaultTheme.colors,
    };
  }
  
  return context;
}

/**
 * Helper to get safe gradient colors for LinearGradient
 * Always returns valid array of color strings
 */
export function getSafeGradientColors(theme?: Theme | null, fallback?: string[]): string[] {
  if (!theme?.colors) {
    return fallback || [defaultTheme.colors.primary, defaultTheme.colors.secondary];
  }
  return [theme.colors.primary, theme.colors.secondary];
}

export { themes };
