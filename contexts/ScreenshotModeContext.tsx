
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ScreenshotModeContextType {
  screenshotMode: boolean;
  setScreenshotMode: (enabled: boolean) => Promise<void>;
}

const ScreenshotModeContext = createContext<ScreenshotModeContextType | undefined>(undefined);

const SCREENSHOT_MODE_STORAGE_KEY = '@safe_space_screenshot_mode';

export function ScreenshotModeProvider({ children }: { children: React.ReactNode }) {
  const [screenshotMode, setScreenshotModeState] = useState(false);

  // Load screenshot mode setting on mount
  useEffect(() => {
    const loadScreenshotMode = async () => {
      try {
        const saved = await AsyncStorage.getItem(SCREENSHOT_MODE_STORAGE_KEY);
        if (saved !== null) {
          setScreenshotModeState(saved === 'true');
        }
      } catch (error) {
        console.error('[ScreenshotMode] Error loading screenshot mode:', error);
      }
    };

    loadScreenshotMode();
  }, []);

  const setScreenshotMode = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(SCREENSHOT_MODE_STORAGE_KEY, enabled.toString());
      setScreenshotModeState(enabled);
      console.log('[ScreenshotMode] Screenshot mode set to:', enabled);
    } catch (error) {
      console.error('[ScreenshotMode] Error saving screenshot mode:', error);
    }
  };

  return (
    <ScreenshotModeContext.Provider value={{ screenshotMode, setScreenshotMode }}>
      {children}
    </ScreenshotModeContext.Provider>
  );
}

export function useScreenshotMode() {
  const context = useContext(ScreenshotModeContext);
  if (context === undefined) {
    throw new Error('useScreenshotMode must be used within a ScreenshotModeProvider');
  }
  return context;
}
