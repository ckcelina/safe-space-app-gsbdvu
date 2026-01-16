
/**
 * useThemeSettings Hook
 * 
 * Hook for managing theme selection and updates.
 */

import { useState, useEffect, useCallback } from 'react';
import { useThemeContext, ThemeKey } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/useToast';
import { THEMES } from '../constants';

export interface UseThemeSettingsReturn {
  selectedTheme: ThemeKey;
  themes: { key: ThemeKey; name: string }[];
  handleThemeSelect: (themeKey: ThemeKey) => Promise<void>;
}

export function useThemeSettings(): UseThemeSettingsReturn {
  const { themeKey, setTheme } = useThemeContext();
  const { success } = useToast();
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>(themeKey);

  useEffect(() => {
    setSelectedTheme(themeKey);
  }, [themeKey]);

  const handleThemeSelect = useCallback(async (themeKey: ThemeKey) => {
    console.log('[Settings] Theme selected:', themeKey);
    setSelectedTheme(themeKey);
    await setTheme(themeKey);
    success('Theme updated!');
  }, [setTheme, success]);

  return {
    selectedTheme,
    themes: THEMES,
    handleThemeSelect,
  };
}

