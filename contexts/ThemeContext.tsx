
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeKey = 'ocean' | 'rose' | 'forest' | 'custom';

interface Theme {
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

const themes: Record<ThemeKey, Theme> = {
  ocean: {
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
  rose: {
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
  forest: {
    primary: '#34C759',
    secondary: '#30D158',
    background: '#F0F9F4',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#B8E6C9',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
  },
  custom: {
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
};

const defaultTheme: Theme = themes.ocean;

interface ThemeContextType {
  theme: Theme;
  themeKey: ThemeKey;
  setThemeKey: (key: ThemeKey) => void;
}

const defaultContextValue: ThemeContextType = {
  theme: defaultTheme,
  themeKey: 'ocean',
  setThemeKey: () => {},
};

export const ThemeContext = createContext<ThemeContextType>(defaultContextValue);

const THEME_STORAGE_KEY = '@safe_space_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKeyState] = useState<ThemeKey>('ocean');
  const [theme, setTheme] = useState<Theme>(themes.ocean);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme as ThemeKey) in themes) {
        const key = savedTheme as ThemeKey;
        setThemeKeyState(key);
        setTheme(themes[key]);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const setThemeKey = async (key: ThemeKey) => {
    try {
      setThemeKeyState(key);
      setTheme(themes[key]);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, key);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeKey, setThemeKey }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * Must be used within ThemeProvider
 * Throws error if used outside provider (for development)
 */
export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context || context === defaultContextValue) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Safe hook that returns default theme if context is not available
 * Use this in error boundaries and fallback components
 */
export function useThemeSafe() {
  const context = useContext(ThemeContext);
  return context || defaultContextValue;
}
