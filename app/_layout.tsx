
import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Alert } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";
import { BiometricLockProvider } from "@/contexts/BiometricLockContext";
import { runDevChecklist } from "@/utils/devChecklist";
import { runDevScanRepair } from "@/utils/devScanRepair";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      
      // Run dev checklist and scan & repair in development mode
      // This validates that:
      // 1. AuthProvider is mounted
      // 2. TherapistPersonas loads without errors (no stray tokens)
      // 3. Router is ready
      // 4. All contexts are available
      if (__DEV__) {
        // Small delay to ensure providers are mounted
        setTimeout(() => {
          runDevChecklist();
          runDevScanRepair();
        }, 100);
      }
    }
  }, [loaded]);

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "🔌 You are offline",
        "You can keep using the app! Your changes will be saved locally and synced when you are back online."
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  if (!loaded) {
    return null;
  }

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "rgb(0, 122, 255)",
      background: "rgb(242, 242, 247)",
      card: "rgb(255, 255, 255)",
      text: "rgb(0, 0, 0)",
      border: "rgb(216, 216, 220)",
      notification: "rgb(255, 59, 48)",
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "rgb(10, 132, 255)",
      background: "rgb(1, 1, 1)",
      card: "rgb(28, 28, 30)",
      text: "rgb(255, 255, 255)",
      border: "rgb(44, 44, 46)",
      notification: "rgb(255, 69, 58)",
    },
  };

  return (
    <>
      <StatusBar style="auto" animated />
      <NavigationThemeProvider
        value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
      >
        {/* 
          CRITICAL PROVIDER ORDER:
          AuthProvider MUST wrap everything that uses auth state
          This prevents "useAuth must be used within AuthProvider" crashes
        */}
        <AuthProvider>
          <ThemeProvider>
            <UserPreferencesProvider>
              <BiometricLockProvider>
                <WidgetProvider>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <Stack screenOptions={{ headerShown: false }}>
                      {/* Auth & Onboarding Screens */}
                      <Stack.Screen name="index" />
                      <Stack.Screen name="onboarding" />
                      <Stack.Screen name="theme-selection" />
                      <Stack.Screen name="ai-preferences-onboarding" />
                      <Stack.Screen name="login" />
                      <Stack.Screen name="signup" />
                      <Stack.Screen name="forgot-password" />
                      <Stack.Screen name="reset-password" />
                      <Stack.Screen name="auth-callback" />

                      {/* Main App Tabs */}
                      <Stack.Screen name="(tabs)" />

                      {/* Dev Screens */}
                      <Stack.Screen name="(dev)" />

                      {/* Standalone Screens */}
                      <Stack.Screen name="edit-profile" />
                      <Stack.Screen name="test-ai-response" />

                      {/* Legal Screens */}
                      <Stack.Screen name="legal/privacy-policy" />
                      <Stack.Screen name="legal/terms-of-service" />
                      <Stack.Screen name="legal/terms-summary" />

                      {/* Modal Screens */}
                      <Stack.Screen
                        name="modal"
                        options={{
                          presentation: "modal",
                          title: "Standard Modal",
                        }}
                      />
                      <Stack.Screen
                        name="formsheet"
                        options={{
                          presentation: "formSheet",
                          title: "Form Sheet Modal",
                          sheetGrabberVisible: true,
                          sheetAllowedDetents: [0.5, 0.8, 1.0],
                          sheetCornerRadius: 20,
                        }}
                      />
                      <Stack.Screen
                        name="transparent-modal"
                        options={{
                          presentation: "transparentModal",
                          headerShown: false,
                        }}
                      />

                      {/* 404 */}
                      <Stack.Screen name="+not-found" />
                    </Stack>
                    <SystemBars style={"auto"} />
                  </GestureHandlerRootView>
                </WidgetProvider>
              </BiometricLockProvider>
            </UserPreferencesProvider>
          </ThemeProvider>
        </AuthProvider>
      </NavigationThemeProvider>
    </>
  );
}
