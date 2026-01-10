
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

const THEMES: Record<ThemeKey, Theme> = {
  ocean: {
    primary: '#0066CC',
    secondary: '#4A90E2',
    background: '#F0F4F8',
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
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#666666',
    border: '#E0E0E0',
    error: '#D32F2F',
    success: '#388E3C',
    warning: '#F57C00',
  },
};

interface ThemeContextType {
  theme: Theme;
  themeKey: ThemeKey;
  setThemeKey: (key: ThemeKey) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKeyState] = useState<ThemeKey>('ocean');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('theme_key');
      if (saved && saved in THEMES) {
        setThemeKeyState(saved as ThemeKey);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const setThemeKey = async (key: ThemeKey) => {
    try {
      await AsyncStorage.setItem('theme_key', key);
      setThemeKeyState(key);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const theme = THEMES[themeKey];

  return (
    <ThemeContext.Provider value={{ theme, themeKey, setThemeKey }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
}
