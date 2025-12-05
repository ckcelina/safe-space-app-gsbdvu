
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeType } from '@/types/database.types';
import { colors, softRoseColors, forestGreenColors } from '@/styles/commonStyles';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => Promise<void>;
  colors: typeof colors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@safe_space_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('ocean-blue');
  const [currentColors, setCurrentColors] = useState(colors);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
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
  };

  const updateColors = (themeType: ThemeType) => {
    switch (themeType) {
      case 'soft-rose':
        setCurrentColors(softRoseColors);
        break;
      case 'forest-green':
        setCurrentColors(forestGreenColors);
        break;
      case 'ocean-blue':
      default:
        setCurrentColors(colors);
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
