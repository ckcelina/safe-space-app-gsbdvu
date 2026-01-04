
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeKey = 'ocean' | 'rose' | 'forest' | 'custom';

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

interface Theme {
  key: ThemeKey;
  name: string;
  colors: ThemeColors;
  gradientColors: string[];
}

const THEMES: Record<ThemeKey, Theme> = {
  ocean: {
    key: 'ocean',
    name: 'Ocean Blue',
    colors: {
      primary: '#007AFF',
      secondary: '#5AC8FA',
      background: '#F2F2F7',
      surface: '#FFFFFF',
      text: '#000000',
      textSecondary: '#8E8E93',
      border: '#C6C6C8',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
    },
    gradientColors: ['#007AFF', '#5AC8FA'],
  },
  rose: {
    key: 'rose',
    name: 'Soft Rose',
    colors: {
      primary: '#FF2D55',
      secondary: '#FF6482',
      background: '#FFF5F7',
      surface: '#FFFFFF',
      text: '#000000',
      textSecondary: '#8E8E93',
      border: '#FFD1DC',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
    },
    gradientColors: ['#FF2D55', '#FF6482'],
  },
  forest: {
    key: 'forest',
    name: 'Forest Green',
    colors: {
      primary: '#34C759',
      secondary: '#30D158',
      background: '#F2F9F4',
      surface: '#FFFFFF',
      text: '#000000',
      textSecondary: '#8E8E93',
      border: '#C6E5CE',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
    },
    gradientColors: ['#34C759', '#30D158'],
  },
  custom: {
    key: 'custom',
    name: 'Custom',
    colors: {
      primary: '#007AFF',
      secondary: '#5AC8FA',
      background: '#F2F2F7',
      surface: '#FFFFFF',
      text: '#000000',
      textSecondary: '#8E8E93',
      border: '#C6C6C8',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
    },
    gradientColors: ['#007AFF', '#5AC8FA'],
  },
};

interface ThemeContextType {
  theme: Theme;
  themeKey: ThemeKey;
  setTheme: (key: ThemeKey) => void;
  colors: ThemeColors;
  gradientColors: string[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@safe_space_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>('ocean');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved && THEMES[saved as ThemeKey]) {
        setThemeKey(saved as ThemeKey);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const setTheme = async (key: ThemeKey) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, key);
      setThemeKey(key);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const theme = THEMES[themeKey];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeKey,
        setTheme,
        colors: theme.colors,
        gradientColors: theme.gradientColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

// Safe hook that provides default theme if context unavailable
export function useThemeSafe() {
  const context = useContext(ThemeContext);
  return context ?? {
    theme: THEMES.ocean,
    themeKey: 'ocean' as ThemeKey,
    setTheme: () => {},
    colors: THEMES.ocean.colors,
    gradientColors: THEMES.ocean.gradientColors,
  };
}
