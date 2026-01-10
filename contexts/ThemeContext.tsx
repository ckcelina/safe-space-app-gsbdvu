
/**
 * Theme Context - Safe Implementation
 * Provides theme state with safe fallbacks
 */

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

interface ThemeContextType {
  themeKey: ThemeKey;
  theme: ThemeColors;
  setTheme: (key: ThemeKey) => void;
}

const THEME_STORAGE_KEY = '@theme_key';

const THEMES: Record<ThemeKey, ThemeColors> = {
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
    primary: '#30D158',
    secondary: '#32AE85',
    background: '#F0F9F4',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#B8E6CC',
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

// Create context with safe default
const ThemeContext = createContext<ThemeContextType>({
  themeKey: 'ocean',
  theme: THEMES.ocean,
  setTheme: () => {
    console.warn('ThemeContext: setTheme called outside provider');
  },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>('ocean');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved && (saved as ThemeKey) in THEMES) {
        setThemeKey(saved as ThemeKey);
      }
    } catch (error) {
      console.warn('ThemeContext: Failed to load theme', error);
    }
  };

  const setTheme = async (key: ThemeKey) => {
    try {
      setThemeKey(key);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, key);
    } catch (error) {
      console.warn('ThemeContext: Failed to save theme', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        themeKey,
        theme: THEMES[themeKey],
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Safe hook - never throws
 */
export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    console.warn('useThemeContext: Used outside ThemeProvider, returning defaults');
    return {
      themeKey: 'ocean' as ThemeKey,
      theme: THEMES.ocean,
      setTheme: () => {},
    };
  }
  return context;
}
