import "react-native-reanimated";
import React, { useEffect, useMemo, useState } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Alert } from "react-native";
import * as Network from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider as AppThemeProvider } from "@/contexts/ThemeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "onboarding",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Replace useNetworkState hook with a safe poll (no new libs)
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        const offlineNow =
          state.isConnected === false || state.isInternetReachable === false;
        if (!cancelled) setIsOffline(offlineNow);
      } catch {
        // If Network fails on a platform, do nothing (do not crash previews)
      }
    };

    check();
    const id = setInterval(check, 4000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (isOffline) {
      Alert.alert(
        "🔌 You are offline",
        "You can keep using the app! Your changes will be saved locally and synced when you are back online."
      );
    }
  }, [isOffline]);

  const CustomDefaultTheme: Theme = useMemo(
    () => ({
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
    }),
    []
  );

  const CustomDarkTheme: Theme = useMemo(
    () => ({
      ...DarkTheme,
      colors: {
        primary: "rgb(10, 132, 255)",
        background: "rgb(1, 1, 1)",
        card: "rgb(28, 28, 30)",
        text: "rgb(255, 255, 255)",
        border: "rgb(44, 44, 46)",
        notification: "rgb(255, 69, 58)",
      },
    }),
    []
  );

  if (!loaded) return null;

  return (
    <ErrorBoundary>
      <StatusBar style="light" animated translucent={false} />
      <ThemeProvider
        value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
      >
        <AppThemeProvider>
          <AuthProvider>
            <WidgetProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <Stack
                  screenOptions={{
                    gestureEnabled: true,
                    fullScreenGestureEnabled: true,
                    gestureDirection: "horizontal",
                    animation: "slide_from_right",
                    animationDuration: 300,
                    customAnimationOnGesture: true,
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
                <SystemBars style={"light"} />
              </GestureHandlerRootView>
            </WidgetProvider>
          </AuthProvider>
        </AppThemeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}