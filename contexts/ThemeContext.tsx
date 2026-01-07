
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme as useNavigationTheme } from '@react-navigation/native';

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

interface ThemeContextType {
  themeKey: ThemeKey;
  colors: ThemeColors;
  setTheme: (key: ThemeKey) => Promise<void>;
  isDark: boolean;
}

const THEME_STORAGE_KEY = '@safe_space_theme';

const THEME_PRESETS: Record<ThemeKey, ThemeColors> = {
  ocean: {
    primary: '#0077BE',
    secondary: '#00A8E8',
    background: '#F0F8FF',
    surface: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#666666',
    border: '#E0E0E0',
    error: '#D32F2F',
    success: '#388E3C',
    warning: '#F57C00',
  },
  rose: {
    primary: '#E91E63',
    secondary: '#F48FB1',
    background: '#FFF0F5',
    surface: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#666666',
    border: '#E0E0E0',
    error: '#D32F2F',
    success: '#388E3C',
    warning: '#F57C00',
  },
  forest: {
    primary: '#2E7D32',
    secondary: '#66BB6A',
    background: '#F1F8F4',
    surface: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#666666',
    border: '#E0E0E0',
    error: '#D32F2F',
    success: '#388E3C',
    warning: '#F57C00',
  },
  custom: {
    primary: '#6200EE',
    secondary: '#03DAC6',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
    textSecondary: '#666666',
    border: '#E0E0E0',
    error: '#B00020',
    success: '#388E3C',
    warning: '#F57C00',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const navigationTheme = useNavigationTheme();
  const [themeKey, setThemeKey] = useState<ThemeKey>('ocean');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved && (saved as ThemeKey) in THEME_PRESETS) {
        setThemeKey(saved as ThemeKey);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    } finally {
      setIsLoading(false);
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

  const colors = THEME_PRESETS[themeKey];

  const value: ThemeContextType = {
    themeKey,
    colors,
    setTheme,
    isDark: navigationTheme.dark,
  };

  if (isLoading) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return safe defaults to prevent crashes
    return {
      themeKey: 'ocean',
      colors: THEME_PRESETS.ocean,
      setTheme: async () => {},
      isDark: false,
    };
  }
  return context;
}
