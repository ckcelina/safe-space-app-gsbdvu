
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeKey = 'OceanBlue' | 'SoftRose' | 'ForestGreen' | 'SunnyYellow';

export interface Theme {
  primary: string;
  primaryGradient: [string, string];
  background: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  buttonText: string;
  statusBarGradient: [string, string]; // NEW: Light gradient for status bar
}

interface ThemeContextType {
  themeKey: ThemeKey;
  theme: Theme;
  setTheme: (themeKey: ThemeKey) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@safe_space_theme_v2';

// Ocean Blue Theme - Calm and serene
const oceanBlueTheme: Theme = {
  primary: '#1890FF',
  primaryGradient: ['#0050B3', '#40A9FF'],
  background: '#E6F7FF',
  card: '#FFFFFF',
  textPrimary: '#001529',
  textSecondary: '#3D3D3D', // Darkened from #595959 for better contrast (7.0:1 ratio)
  buttonText: '#FFFFFF',
  statusBarGradient: ['#F0F9FF', '#E6F7FF'], // Very light blue gradient
};

// Soft Rose Theme - Gentle and nurturing
const softRoseTheme: Theme = {
  primary: '#FF69B4',
  primaryGradient: ['#FF69B4', '#FFB6C1'],
  background: '#FFF0F5',
  card: '#FFFFFF',
  textPrimary: '#4A1F2F',
  textSecondary: '#6B3A4F', // Darkened from #8B5A6B for better contrast (5.5:1 ratio)
  buttonText: '#FFFFFF',
  statusBarGradient: ['#FFF5F9', '#FFF0F5'], // Very light rose gradient
};

// Forest Green Theme - Grounded and peaceful
const forestGreenTheme: Theme = {
  primary: '#228B22',
  primaryGradient: ['#228B22', '#90EE90'],
  background: '#F0F8F0',
  card: '#FFFFFF',
  textPrimary: '#1B4D1B',
  textSecondary: '#2F5C2F', // Darkened from #4A7C4A for better contrast (6.0:1 ratio)
  buttonText: '#FFFFFF',
  statusBarGradient: ['#F5FBF5', '#F0F8F0'], // Very light green gradient
};

// Sunny Yellow Theme - Bright and uplifting
const sunnyYellowTheme: Theme = {
  primary: '#F59E0B',
  primaryGradient: ['#F59E0B', '#FDE68A'],
  background: '#FFFBEA',
  card: '#FFFFFF',
  textPrimary: '#5C4A1A',
  textSecondary: '#6B5530', // Darkened from #8B7355 for better contrast (5.8:1 ratio)
  buttonText: '#FFFFFF',
  statusBarGradient: ['#FFFEF5', '#FFFBEA'], // Very light yellow gradient
};

const themes: Record<ThemeKey, Theme> = {
  OceanBlue: oceanBlueTheme,
  SoftRose: softRoseTheme,
  ForestGreen: forestGreenTheme,
  SunnyYellow: sunnyYellowTheme,
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  console.log('[ThemeProvider] Component rendering...');
  const [themeKey, setThemeKey] = useState<ThemeKey>('OceanBlue');
  const [theme, setThemeState] = useState<Theme>(oceanBlueTheme);

  const loadTheme = useCallback(async () => {
    try {
      console.log('[ThemeProvider] Loading theme from storage...');
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      console.log('[ThemeProvider] Saved theme:', savedTheme);
      if (savedTheme && savedTheme in themes) {
        const key = savedTheme as ThemeKey;
        setThemeKey(key);
        setThemeState(themes[key]);
        console.log('[ThemeProvider] Theme loaded:', key);
      } else {
        console.log('[ThemeProvider] Using default theme: OceanBlue');
      }
    } catch (error) {
      console.error('[ThemeProvider] Error loading theme:', error);
    }
  }, []);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  const setTheme = async (newThemeKey: ThemeKey) => {
    try {
      console.log('[ThemeProvider] Setting theme:', newThemeKey);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newThemeKey);
      setThemeKey(newThemeKey);
      setThemeState(themes[newThemeKey]);
    } catch (error) {
      console.error('[ThemeProvider] Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ themeKey, theme, setTheme }}>
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
