
import "react-native-reanimated";
import React, { useEffect } from "react";
import { useColorScheme } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { SystemBars } from "react-native-edge-to-edge";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { useNetworkState } from "expo-network";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Sentry from '@sentry/react-native';
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider as CustomThemeProvider } from "@/contexts/ThemeContext";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ServerHealthIndicator } from "@/components/ui/ServerHealthIndicator";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// ============================================================================
// EXPO SERVER STABILITY INITIALIZATION
// ============================================================================
// This section ensures the Expo development server connection remains stable
// and provides automatic recovery if issues occur.
// ============================================================================

if (__DEV__) {
  // Log startup confirmation
  console.log('✅ Safe Space JS loaded');
  console.log('[Startup] Environment:', __DEV__ ? 'development' : 'production');
  console.log('[Startup] Platform:', require('react-native').Platform.OS);
  console.log('[Startup] Timestamp:', new Date().toISOString());

  // Initialize server health monitoring
  const { serverHealthMonitor } = require('@/utils/expoServerHealth');
  serverHealthMonitor.initialize().catch((error: any) => {
    console.log('[Startup] Failed to initialize server health monitor:', error);
  });

  // Initialize Metro connection guard
  const { metroConnectionGuard, setupMetroErrorHandler } = require('@/utils/metroConnectionGuard');
  metroConnectionGuard.initialize().catch((error: any) => {
    console.log('[Startup] Failed to initialize Metro connection guard:', error);
  });

  // Set up Metro error handler
  setupMetroErrorHandler();

  // Run startup validation
  const { startupValidator } = require('@/utils/expoStartupValidator');
  startupValidator.validate().then((validation: any) => {
    if (!validation.isValid) {
      console.log('[Startup] ⚠️ Some startup checks failed, but continuing...');
    }
  });

  // Log diagnostics
  startupValidator.logDiagnostics();

  // Expose diagnostics globally for console access
  if (typeof global !== 'undefined') {
    const { runDiagnostics, exportDiagnostics } = require('@/utils/diagnostics');
    (global as any).runDiagnostics = runDiagnostics;
    (global as any).exportDiagnostics = exportDiagnostics;
    console.log('[Startup] 💡 Tip: Run "global.runDiagnostics()" in console for health report');
  }

  // Global error handler for unhandled promise rejections
  if (typeof ErrorUtils !== 'undefined') {
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      console.log('[Startup] Unhandled error:', {
        message: error.message,
        isFatal,
        stack: error.stack,
      });

      // Mark Metro connection as potentially broken
      if (
        error.message?.includes('Metro') ||
        error.message?.includes('bundler') ||
        error.message?.includes('connection')
      ) {
        metroConnectionGuard.handleConnectionError(error);
      }

      // Only call original handler for fatal errors in production
      if (isFatal && !__DEV__) {
        originalHandler(error, isFatal);
      }
    });
  }

  console.log('[Startup] ✅ Expo server stability systems initialized');
}

// ═══════════════════════════════════════════════════════════════════
// SENTRY ERROR TRACKING - Initialize before anything else
// ═══════════════════════════════════════════════════════════════════
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    enableInExpoDevelopment: false, // Don't send dev errors to Sentry
    debug: __DEV__, // Enable debug logs in development
    tracesSampleRate: 0.2, // 20% of transactions for performance monitoring
    beforeSend(event) {
      // Don't send events in development
      if (__DEV__) {
        console.log('[Sentry] Would send error:', event);
        return null;
      }
      return event;
    },
  });
  console.log('[Sentry] Error tracking initialized');
} else {
  if (__DEV__) {
    console.log('[Sentry] DSN not configured - error tracking disabled');
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) {
      console.log('[Startup] Font loading error:', error);
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      
      // Mark Metro connection as successful after app loads
      if (__DEV__) {
        const { metroConnectionGuard } = require('@/utils/metroConnectionGuard');
        metroConnectionGuard.markConnectionSuccess();
        console.log('[Startup] ✅ App loaded successfully');
      }
    }
  }, [loaded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (__DEV__) {
        const { serverHealthMonitor } = require('@/utils/expoServerHealth');
        serverHealthMonitor.cleanup();
        console.log('[Startup] Cleaned up server health monitor');
      }
    };
  }, []);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ErrorBoundary>
      <CustomThemeProvider>
        <AuthProvider>
          <UserPreferencesProvider>
            <WidgetProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />
                  <Stack.Screen
                    name="onboarding"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                    }}
                  />
                  <Stack.Screen
                    name="theme-selection"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                    }}
                  />
                  <Stack.Screen
                    name="ai-preferences-onboarding"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                    }}
                  />
                  <Stack.Screen
                    name="signup"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                    }}
                  />
                  <Stack.Screen
                    name="login"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                    }}
                  />
                  <Stack.Screen
                    name="forgot-password"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                    }}
                  />
                  <Stack.Screen
                    name="reset-password"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                    }}
                  />
                  <Stack.Screen
                    name="edit-profile"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                    }}
                  />
                  <Stack.Screen
                    name="test-ai-response"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                    }}
                  />
                  <Stack.Screen
                    name="modal"
                    options={{
                      presentation: 'modal',
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="transparent-modal"
                    options={{
                      presentation: 'transparentModal',
                      headerShown: false,
                      animation: 'fade',
                    }}
                  />
                  <Stack.Screen
                    name="formsheet"
                    options={{
                      presentation: 'formSheet',
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="legal/terms-of-service"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                    }}
                  />
                  <Stack.Screen
                    name="legal/privacy-policy"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                    }}
                  />
                  <Stack.Screen
                    name="legal/terms-summary"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                    }}
                  />
                </Stack>
                <StatusBar style="auto" />
                {/* Visual health indicator - only visible in development */}
                <ServerHealthIndicator />
              </ThemeProvider>
            </WidgetProvider>
          </UserPreferencesProvider>
        </AuthProvider>
      </CustomThemeProvider>
    </ErrorBoundary>
  );
}
