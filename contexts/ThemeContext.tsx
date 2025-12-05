
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeType } from '@/types/database.types';

export interface ThemeColors {
  background: string;
  text: string;
  textSecondary: string;
  primary: string;
  secondary: string;
  accent: string;
  card: string;
  highlight: string;
}

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => Promise<void>;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@safe_space_theme';

// Ocean Blue Theme - Calm and serene
const oceanBlueColors: ThemeColors = {
  background: '#E6F7FF',
  text: '#001529',
  textSecondary: '#595959',
  primary: '#1890FF',
  secondary: '#40A9FF',
  accent: '#69C0FF',
  card: '#FFFFFF',
  highlight: '#BAE7FF',
};

// Soft Rose Theme - Gentle and nurturing
const softRoseColors: ThemeColors = {
  background: '#FFF0F5',
  text: '#4A1F2F',
  textSecondary: '#8B5A6B',
  primary: '#FF69B4',
  secondary: '#FFB6C1',
  accent: '#FFC0CB',
  card: '#FFFFFF',
  highlight: '#FFE4E1',
};

// Forest Green Theme - Grounded and peaceful
const forestGreenColors: ThemeColors = {
  background: '#F0F8F0',
  text: '#1B4D1B',
  textSecondary: '#4A7C4A',
  primary: '#228B22',
  secondary: '#32CD32',
  accent: '#90EE90',
  card: '#FFFFFF',
  highlight: '#E8F5E8',
};

// Sunny Yellow Theme - Bright and uplifting
const sunnyYellowColors: ThemeColors = {
  background: '#FFFBEA',
  text: '#5C4A1A',
  textSecondary: '#8B7355',
  primary: '#F59E0B',
  secondary: '#FBBF24',
  accent: '#FCD34D',
  card: '#FFFFFF',
  highlight: '#FEF3C7',
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('ocean-blue');
  const [currentColors, setCurrentColors] = useState<ThemeColors>(oceanBlueColors);

  const loadTheme = useCallback(async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        const themeValue = savedTheme as ThemeType;
        setThemeState(themeValue);
        updateColors(themeValue);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  }, []);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  const updateColors = (themeType: ThemeType) => {
    switch (themeType) {
      case 'soft-rose':
        setCurrentColors(softRoseColors);
        break;
      case 'forest-green':
        setCurrentColors(forestGreenColors);
        break;
      case 'sunny-yellow':
        setCurrentColors(sunnyYellowColors);
        break;
      case 'ocean-blue':
      default:
        setCurrentColors(oceanBlueColors);
        break;
    }
  };

  const setTheme = async (newTheme: ThemeType) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setThemeState(newTheme);
      updateColors(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors: currentColors }}>
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
