
import * as React from "react";
import { createContext, useCallback, useContext } from "react";
import { ExtensionStorage } from "@bacons/apple-targets";
import { Platform } from "react-native";

// Initialize storage with the Safe Space App Group ID
const APP_GROUP_ID = "group.com.safespace.app";
const storage = Platform.OS === 'ios' ? new ExtensionStorage(APP_GROUP_ID) : null;

// UserDefaults keys for theme data
const THEME_KEYS = {
  THEME_ID: "safe_space_theme_id",
  THEME_PRIMARY: "safe_space_theme_primary",
  THEME_GRADIENT_START: "safe_space_theme_gradient_start",
  THEME_GRADIENT_END: "safe_space_theme_gradient_end",
};

export interface WidgetThemeData {
  themeId: string;
  primaryHex: string;
  gradientStartHex: string;
  gradientEndHex: string;
}

type WidgetContextType = {
  refreshWidget: () => void;
  updateWidgetTheme: (themeData: WidgetThemeData) => void;
};

const missingProviderMessage =
  "useWidget was called outside of a WidgetProvider. Make sure WidgetProvider wraps the app.";

const devFallbackContext: WidgetContextType = {
  refreshWidget: () => console.warn(`[Widget] refreshWidget noop: ${missingProviderMessage}`),
  updateWidgetTheme: () => console.warn(`[Widget] updateWidgetTheme noop: ${missingProviderMessage}`),
};

const prodFallbackContext: WidgetContextType = {
  refreshWidget: () => {},
  updateWidgetTheme: () => {},
};

const WidgetContext = createContext<WidgetContextType | null>(null);

let hasLoggedMissingProviderWarning = false;

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  const refreshWidget = useCallback(() => {
    if (Platform.OS === 'ios' && storage) {
      try {
        ExtensionStorage.reloadWidget();
        console.log('[Widget] Widget refresh triggered');
      } catch (error) {
        console.error('[Widget] Failed to refresh widget:', error);
      }
    }
  }, []);

  const updateWidgetTheme = useCallback((themeData: WidgetThemeData) => {
    if (Platform.OS === 'ios' && storage) {
      try {
        // Save theme data to shared UserDefaults
        storage.set(THEME_KEYS.THEME_ID, themeData.themeId);
        storage.set(THEME_KEYS.THEME_PRIMARY, themeData.primaryHex);
        storage.set(THEME_KEYS.THEME_GRADIENT_START, themeData.gradientStartHex);
        storage.set(THEME_KEYS.THEME_GRADIENT_END, themeData.gradientEndHex);
        
        console.log('[Widget] Theme data saved to shared storage:', themeData);
        
        // Trigger widget refresh
        ExtensionStorage.reloadWidget();
        console.log('[Widget] Widget refresh triggered after theme update');
      } catch (error) {
        console.error('[Widget] Failed to update widget theme:', error);
      }
    } else if (Platform.OS !== 'ios') {
      console.log('[Widget] Widget updates are only supported on iOS');
    }
  }, []);

  return (
    <WidgetContext.Provider value={{ refreshWidget, updateWidgetTheme }}>
      {children}
    </WidgetContext.Provider>
  );
}

export const useWidget = () => {
  const context = useContext(WidgetContext);
  if (context) {
    return context;
  }

  if (__DEV__ && !hasLoggedMissingProviderWarning) {
    console.error(`[Widget] ${missingProviderMessage}`);
    hasLoggedMissingProviderWarning = true;
  }

  return __DEV__ ? devFallbackContext : prodFallbackContext;
  }

  const message =
    "useWidget was called outside of a WidgetProvider. Make sure WidgetProvider wraps the app.";

  if (__DEV__) {
    console.error(`[Widget] ${message}`);
    return {
      refreshWidget: () => console.warn(`[Widget] refreshWidget noop: ${message}`),
      updateWidgetTheme: () => console.warn(`[Widget] updateWidgetTheme noop: ${message}`),
    };
  }

  return {
    refreshWidget: () => {},
    updateWidgetTheme: () => {},
  };
};

export const isWidgetContextFallback = (context: WidgetContextType) =>
  context === devFallbackContext || context === prodFallbackContext;
