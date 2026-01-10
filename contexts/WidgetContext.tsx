
import * as React from "react";
import { createContext, useCallback, useContext } from "react";
import { ExtensionStorage } from "@bacons/apple-targets";
import { Platform } from "react-native";

// Get widget group ID from environment or use default
const WIDGET_GROUP_ID = process.env.EXPO_PUBLIC_WIDGET_GROUP_ID || "group.com.anonymous.Natively";

// Initialize storage with group ID (iOS only)
const storage = Platform.OS === "ios" ? new ExtensionStorage(WIDGET_GROUP_ID) : null;

type WidgetContextType = {
  refreshWidget: () => void;
};

const WidgetContext = createContext<WidgetContextType | null>(null);

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  // Update widget state whenever what we want to show changes
  React.useEffect(() => {
    if (Platform.OS === "ios" && storage) {
      // Refresh widget on mount
      ExtensionStorage.reloadWidget();
    }
  }, []);

  const refreshWidget = useCallback(() => {
    if (Platform.OS === "ios") {
      ExtensionStorage.reloadWidget();
    }
  }, []);

  return (
    <WidgetContext.Provider value={{ refreshWidget }}>
      {children}
    </WidgetContext.Provider>
  );
}

export const useWidget = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error("useWidget must be used within a WidgetProvider");
  }
  return context;
};
