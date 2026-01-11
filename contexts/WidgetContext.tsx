
/**
 * Widget Context - Safe Implementation
 * Provides widget refresh functionality with safe fallbacks
 */

import React, { createContext, useCallback, useContext, useEffect } from 'react';
import { ExtensionStorage } from '@bacons/apple-targets';

// Initialize storage with your group ID
const storage = new ExtensionStorage('group.com.<user_name>.<app_name>');

type WidgetContextType = {
  refreshWidget: () => void;
};

// Create context with safe default
const WidgetContext = createContext<WidgetContextType>({
  refreshWidget: () => {
    console.warn('WidgetContext: refreshWidget called outside provider');
  },
});

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      ExtensionStorage.reloadWidget();
    } catch (error) {
      console.warn('WidgetContext: Failed to reload widget', error);
    }
  }, []);

  const refreshWidget = useCallback(() => {
    try {
      ExtensionStorage.reloadWidget();
    } catch (error) {
      console.warn('WidgetContext: Failed to refresh widget', error);
    }
  }, []);

  return (
    <WidgetContext.Provider value={{ refreshWidget }}>
      {children}
    </WidgetContext.Provider>
  );
}

/**
 * Safe hook - never throws
 */
export const useWidget = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    console.warn('useWidget: Used outside WidgetProvider, returning safe default');
    return {
      refreshWidget: () => {},
    };
  }
  return context;
};
