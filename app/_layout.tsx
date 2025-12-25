
import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Alert, View, Platform } from "react-native";
import { useNetworkState } from "expo-network";
import Constants from "expo-constants";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { WidgetProvider } from "@/contexts/WidgetContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider as AppThemeProvider, useThemeContext } from "@/contexts/ThemeContext";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { runDevDiagnostics, logStartupError } from "@/utils/devDiagnostics";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "onboarding",
};

// Global error handler for unhandled promise rejections
if (typeof global !== 'undefined') {
  const originalHandler = ErrorUtils.getGlobalHandler();
  
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    // Log startup errors without crashing
    logStartupError('Unhandled Error', error);
    
    // Only call original handler for fatal errors in production
    if (isFatal && !__DEV__) {
      originalHandler(error, isFatal);
    }
  });
}

// Inner component that has access to theme context
function RootLayoutInner() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const { theme } = useThemeContext();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Run dev diagnostics on mount (in useEffect to avoid blocking render)
  useEffect(() => {
    try {
      runDevDiagnostics();
    } catch (error) {
      logStartupError('Dev Diagnostics', error);
    }
  }, []);

  // Startup logging - confirms JS bundle is loaded
  useEffect(() => {
    try {
      const env = __DEV__ ? 'development' : 'production';
      const platform = Platform.OS;
      
      console.log('✅ Safe Space JS loaded');
      console.log(`[Startup] Environment: ${env}`);
      console.log(`[Startup] Platform: ${platform}`);
      console.log(`[Startup] Expo SDK: ${Constants.expoConfig?.sdkVersion || 'unknown'}`);
    } catch (error) {
      logStartupError('Startup Logging', error);
    }
  }, []);

  useEffect(() => {
    try {
      if (loaded) {
        console.log('[Startup] Fonts loaded, hiding splash screen');
        SplashScreen.hideAsync();
      }
    } catch (error) {
      logStartupError('Splash Screen', error);
    }
  }, [loaded]);

  React.useEffect(() => {
    try {
      if (!networkState.isConnected && networkState.isInternetReachable === false) {
        Alert.alert(
          "🔌 You are offline",
          "You can keep using the app! Your changes will be saved locally and synced when you are back online."
        );
      }
    } catch (error) {
      logStartupError('Network Check', error);
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  if (!loaded) return null;

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

  // Use the first color of the gradient (top color) for status bar background
  // This ensures the status bar matches the section below it seamlessly
  const statusBarBackgroundColor = theme.primaryGradient[0];

  return (
    <>
      {/* Status bar with dynamic background color matching the top of the gradient */}
      <StatusBar 
        style="light" 
        backgroundColor={statusBarBackgroundColor}
        translucent={false}
      />

      <ThemeProvider
        value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
      >
        {/* Root view with gradient's top color - ensures seamless status bar */}
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: statusBarBackgroundColor }}>
          <View style={{ flex: 1, backgroundColor: statusBarBackgroundColor }}>
            <Stack
              screenOptions={{
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
                gestureDirection: "horizontal",
                animation: "slide_from_right",
                animationDuration: 300,
                customAnimationOnGesture: true,
                contentStyle: { backgroundColor: statusBarBackgroundColor },
              }}
            >
              <Stack.Screen
                name="onboarding"
                options={{
                  headerShown: false,
                  gestureEnabled: false,
                  animation: "fade",
                }}
              />
              <Stack.Screen
                name="theme-selection"
                options={{
                  headerShown: false,
                  gestureEnabled: true,
                  fullScreenGestureEnabled: true,
                  animation: "slide_from_right",
                }}
              />
              <Stack.Screen
                name="signup"
                options={{
                  headerShown: false,
                  gestureEnabled: true,
                  fullScreenGestureEnabled: true,
                  animation: "slide_from_right",
                }}
              />
              <Stack.Screen
                name="ai-preferences-onboarding"
                options={{
                  headerShown: false,
                  gestureEnabled: false,
                  animation: "slide_from_right",
                }}
              />
              <Stack.Screen
                name="login"
                options={{
                  headerShown: false,
                  gestureEnabled: true,
                  fullScreenGestureEnabled: true,
                  animation: "slide_from_right",
                }}
              />
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                  gestureEnabled: false,
                  animation: "fade",
                }}
              />
              <Stack.Screen
                name="modal"
                options={{
                  presentation: "modal",
                  title: "Standard Modal",
                  gestureEnabled: true,
                  animation: "slide_from_bottom",
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
                  gestureEnabled: true,
                  animation: "slide_from_bottom",
                }}
              />
              <Stack.Screen
                name="transparent-modal"
                options={{
                  presentation: "transparentModal",
                  headerShown: false,
                  gestureEnabled: true,
                  animation: "fade",
                }}
              />
              <Stack.Screen
                name="edit-profile"
                options={{
                  headerShown: false,
                  gestureEnabled: true,
                  fullScreenGestureEnabled: true,
                  animation: "slide_from_right",
                }}
              />
              <Stack.Screen
                name="legal/privacy-policy"
                options={{
                  headerShown: false,
                  gestureEnabled: true,
                  fullScreenGestureEnabled: true,
                  animation: "slide_from_right",
                }}
              />
              <Stack.Screen
                name="legal/terms-of-service"
                options={{
                  headerShown: false,
                  gestureEnabled: true,
                  fullScreenGestureEnabled: true,
                  animation: "slide_from_right",
                }}
              />
              <Stack.Screen
                name="legal/terms-summary"
                options={{
                  headerShown: false,
                  gestureEnabled: true,
                  fullScreenGestureEnabled: true,
                  animation: "slide_from_right",
                }}
              />
            </Stack>
          </View>

          {/* SystemBars with light style for consistency */}
          <SystemBars style="light" />
        </GestureHandlerRootView>
      </ThemeProvider>
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppThemeProvider>
          <AuthProvider>
            <UserPreferencesProvider>
              <WidgetProvider>
                <RootLayoutInner />
              </WidgetProvider>
            </UserPreferencesProvider>
          </AuthProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
