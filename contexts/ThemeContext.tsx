
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeKey = 'ocean' | 'rose' | 'forest' | 'custom';

interface Theme {
  primaryGradient: string[];
  secondaryGradient: string[];
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  statusBarStyle: 'light' | 'dark';
  gradientColors: string[];
}

const THEMES: Record<ThemeKey, Theme> = {
  ocean: {
    primaryGradient: ['#667eea', '#764ba2'],
    secondaryGradient: ['#4facfe', '#00f2fe'],
    background: '#f0f4f8',
    surface: '#ffffff',
    textPrimary: '#1a202c',
    textSecondary: '#718096',
    accent: '#667eea',
    statusBarStyle: 'dark',
    gradientColors: ['#667eea', '#764ba2'],
  },
  rose: {
    primaryGradient: ['#f093fb', '#f5576c'],
    secondaryGradient: ['#ffecd2', '#fcb69f'],
    background: '#fff5f7',
    surface: '#ffffff',
    textPrimary: '#2d3748',
    textSecondary: '#718096',
    accent: '#f5576c',
    statusBarStyle: 'dark',
    gradientColors: ['#f093fb', '#f5576c'],
  },
  forest: {
    primaryGradient: ['#56ab2f', '#a8e063'],
    secondaryGradient: ['#134e5e', '#71b280'],
    background: '#f0f9f4',
    surface: '#ffffff',
    textPrimary: '#1a202c',
    textSecondary: '#718096',
    accent: '#56ab2f',
    statusBarStyle: 'dark',
    gradientColors: ['#56ab2f', '#a8e063'],
  },
  custom: {
    primaryGradient: ['#667eea', '#764ba2'],
    secondaryGradient: ['#4facfe', '#00f2fe'],
    background: '#f0f4f8',
    surface: '#ffffff',
    textPrimary: '#1a202c',
    textSecondary: '#718096',
    accent: '#667eea',
    statusBarStyle: 'dark',
    gradientColors: ['#667eea', '#764ba2'],
  },
};

interface ThemeContextType {
  theme: Theme;
  themeKey: ThemeKey;
  setTheme: (key: ThemeKey) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>('ocean');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('theme');
      if (saved) setThemeKey(saved as ThemeKey);
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const setTheme = async (key: ThemeKey) => {
    try {
      await AsyncStorage.setItem('theme', key);
      setThemeKey(key);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: THEMES[themeKey], themeKey, setTheme }}>
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
