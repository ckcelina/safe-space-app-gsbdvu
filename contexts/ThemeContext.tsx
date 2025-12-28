
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWidget } from './WidgetContext';

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

// Theme ID mapping for widget storage
const THEME_ID_MAP: Record<ThemeKey, string> = {
  OceanBlue: 'ocean_blue',
  SoftRose: 'soft_rose',
  ForestGreen: 'forest_green',
  SunnyYellow: 'sunny_yellow',
};

// Ocean Blue Theme - Calm and serene
const oceanBlueTheme: Theme = {
  primary: '#1890FF',
  primaryGradient: ['#0050B3', '#40A9FF'],
  background: '#E6F7FF',
  card: '#FFFFFF',
  textPrimary: '#001529',
  textSecondary: '#595959',
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
  textSecondary: '#8B5A6B',
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
  textSecondary: '#4A7C4A',
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
  textSecondary: '#8B7355',
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
  const [themeKey, setThemeKey] = useState<ThemeKey>('SoftRose'); // Default to soft_rose as per requirements
  const [theme, setThemeState] = useState<Theme>(softRoseTheme);
  
  // Call useWidget at the top level to comply with React Hooks rules
  const widgetContext = useWidget();

  const loadTheme = useCallback(async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && savedTheme in themes) {
        const key = savedTheme as ThemeKey;
        setThemeKey(key);
        setThemeState(themes[key]);
        
        // Update widget with loaded theme
        const themeData = {
          themeId: THEME_ID_MAP[key],
          primaryHex: themes[key].primary,
          gradientStartHex: themes[key].primaryGradient[0],
          gradientEndHex: themes[key].primaryGradient[1],
        };
        widgetContext.updateWidgetTheme(themeData);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  }, [widgetContext]);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  const setTheme = useCallback(async (newThemeKey: ThemeKey) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newThemeKey);
      setThemeKey(newThemeKey);
      setThemeState(themes[newThemeKey]);
      
      // Update widget with new theme
      const themeData = {
        themeId: THEME_ID_MAP[newThemeKey],
        primaryHex: themes[newThemeKey].primary,
        gradientStartHex: themes[newThemeKey].primaryGradient[0],
        gradientEndHex: themes[newThemeKey].primaryGradient[1],
      };
      widgetContext.updateWidgetTheme(themeData);
      console.log('[Theme] Theme changed to:', newThemeKey, 'Widget updated');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, [widgetContext]);

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
