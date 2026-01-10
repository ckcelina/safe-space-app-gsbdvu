
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeKey = 'OceanBlue' | 'SoftRose' | 'ForestGreen' | 'SunnyYellow';

export interface Theme {
  primary: string;
  primaryGradient: [string, string];
  gradientColors: [string, string]; // For full-screen gradients like lock screen
  background: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  buttonText: string;
  buttonBackground: string; // For button backgrounds
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
  gradientColors: ['#0050B3', '#40A9FF'],
  background: '#E6F7FF',
  card: '#FFFFFF',
  textPrimary: '#001529',
  textSecondary: '#595959',
  buttonText: '#FFFFFF',
  buttonBackground: '#1890FF',
  statusBarGradient: ['#F0F9FF', '#E6F7FF'], // Very light blue gradient
};

// Soft Rose Theme - Gentle and nurturing
const softRoseTheme: Theme = {
  primary: '#FF69B4',
  primaryGradient: ['#FF69B4', '#FFB6C1'],
  gradientColors: ['#FF69B4', '#FFB6C1'],
  background: '#FFF0F5',
  card: '#FFFFFF',
  textPrimary: '#4A1F2F',
  textSecondary: '#8B5A6B',
  buttonText: '#FFFFFF',
  buttonBackground: '#FF69B4',
  statusBarGradient: ['#FFF5F9', '#FFF0F5'], // Very light rose gradient
};

// Forest Green Theme - Grounded and peaceful
const forestGreenTheme: Theme = {
  primary: '#228B22',
  primaryGradient: ['#228B22', '#90EE90'],
  gradientColors: ['#228B22', '#90EE90'],
  background: '#F0F8F0',
  card: '#FFFFFF',
  textPrimary: '#1B4D1B',
  textSecondary: '#4A7C4A',
  buttonText: '#FFFFFF',
  buttonBackground: '#228B22',
  statusBarGradient: ['#F5FBF5', '#F0F8F0'], // Very light green gradient
};

// Sunny Yellow Theme - Bright and uplifting
const sunnyYellowTheme: Theme = {
  primary: '#F59E0B',
  primaryGradient: ['#F59E0B', '#FDE68A'],
  gradientColors: ['#F59E0B', '#FDE68A'],
  background: '#FFFBEA',
  card: '#FFFFFF',
  textPrimary: '#5C4A1A',
  textSecondary: '#8B7355',
  buttonText: '#FFFFFF',
  buttonBackground: '#F59E0B',
  statusBarGradient: ['#FFFEF5', '#FFFBEA'], // Very light yellow gradient
};

const themes: Record<ThemeKey, Theme> = {
  OceanBlue: oceanBlueTheme,
  SoftRose: softRoseTheme,
  ForestGreen: forestGreenTheme,
  SunnyYellow: sunnyYellowTheme,
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>('OceanBlue');
  const [theme, setThemeState] = useState<Theme>(oceanBlueTheme);

  const loadTheme = useCallback(async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && savedTheme in themes) {
        const key = savedTheme as ThemeKey;
        setThemeKey(key);
        setThemeState(themes[key]);
        console.log('[Theme] ✅ Loaded saved theme:', key);
      } else {
        console.log('[Theme] ℹ️ Using default theme: OceanBlue');
      }
    } catch (error) {
      console.error('[Theme] ⚠️ Error loading theme:', error);
    }
  }, []);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  const setTheme = async (newThemeKey: ThemeKey) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newThemeKey);
      setThemeKey(newThemeKey);
      setThemeState(themes[newThemeKey]);
      console.log('[Theme] ✅ Theme changed to:', newThemeKey);
    } catch (error) {
      console.error('[Theme] ⚠️ Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ themeKey, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * Returns safe fallback if used outside ThemeProvider (prevents crashes)
 */
export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    console.warn('⚠️ useThemeContext called outside ThemeProvider - returning safe fallback');
    // Return safe fallback to prevent app crash
    return {
      themeKey: 'OceanBlue' as ThemeKey,
      theme: oceanBlueTheme,
      setTheme: async () => { 
        console.warn('ThemeProvider not mounted, cannot set theme'); 
      },
    };
  }
  return context;
}
