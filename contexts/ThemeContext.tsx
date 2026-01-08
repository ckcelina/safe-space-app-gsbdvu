
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeKey = 'ocean' | 'rose' | 'forest' | 'custom';

interface Theme {
  // Core colors
  primary: string;
  secondary: string;
  background: string;
  card: string;
  surface: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  buttonText: string;
  
  // UI elements
  border: string;
  error: string;
  success: string;
  warning: string;
  
  // Gradients
  primaryGradient: string[];
  gradientColors: string[];
  
  // Status bar
  statusBarStyle: 'light' | 'dark';
}

interface ThemeContextType {
  themeKey: ThemeKey;
  theme: Theme;
  colors: Theme; // Alias for backwards compatibility
  setTheme: (key: ThemeKey) => Promise<void>;
  isDark: boolean;
}

const THEME_STORAGE_KEY = '@safe_space_theme';

const THEME_PRESETS: Record<ThemeKey, Theme> = {
  ocean: {
    primary: '#0077BE',
    secondary: '#00A8E8',
    background: '#F0F8FF',
    card: '#FFFFFF',
    surface: '#FFFFFF',
    textPrimary: '#1A1A1A',
    textSecondary: '#666666',
    buttonText: '#FFFFFF',
    border: '#E0E0E0',
    error: '#D32F2F',
    success: '#388E3C',
    warning: '#F57C00',
    primaryGradient: ['#0077BE', '#00A8E8'],
    gradientColors: ['#0077BE', '#00A8E8'],
    statusBarStyle: 'light',
  },
  rose: {
    primary: '#E91E63',
    secondary: '#F48FB1',
    background: '#FFF0F5',
    card: '#FFFFFF',
    surface: '#FFFFFF',
    textPrimary: '#1A1A1A',
    textSecondary: '#666666',
    buttonText: '#FFFFFF',
    border: '#E0E0E0',
    error: '#D32F2F',
    success: '#388E3C',
    warning: '#F57C00',
    primaryGradient: ['#E91E63', '#F48FB1'],
    gradientColors: ['#E91E63', '#F48FB1'],
    statusBarStyle: 'light',
  },
  forest: {
    primary: '#2E7D32',
    secondary: '#66BB6A',
    background: '#F1F8F4',
    card: '#FFFFFF',
    surface: '#FFFFFF',
    textPrimary: '#1A1A1A',
    textSecondary: '#666666',
    buttonText: '#FFFFFF',
    border: '#E0E0E0',
    error: '#D32F2F',
    success: '#388E3C',
    warning: '#F57C00',
    primaryGradient: ['#2E7D32', '#66BB6A'],
    gradientColors: ['#2E7D32', '#66BB6A'],
    statusBarStyle: 'light',
  },
  custom: {
    primary: '#6200EE',
    secondary: '#03DAC6',
    background: '#FFFFFF',
    card: '#F5F5F5',
    surface: '#F5F5F5',
    textPrimary: '#000000',
    textSecondary: '#666666',
    buttonText: '#FFFFFF',
    border: '#E0E0E0',
    error: '#B00020',
    success: '#388E3C',
    warning: '#F57C00',
    primaryGradient: ['#6200EE', '#03DAC6'],
    gradientColors: ['#6200EE', '#03DAC6'],
    statusBarStyle: 'light',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
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

  const theme = THEME_PRESETS[themeKey];

  const value: ThemeContextType = {
    themeKey,
    theme,
    colors: theme, // Alias for backwards compatibility
    setTheme,
    isDark: false, // Safe Space uses light themes
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
    console.warn('useThemeContext: Used outside ThemeProvider, returning safe defaults');
    return {
      themeKey: 'ocean',
      theme: THEME_PRESETS.ocean,
      colors: THEME_PRESETS.ocean,
      setTheme: async () => {},
      isDark: false,
    };
  }
  return context;
}
