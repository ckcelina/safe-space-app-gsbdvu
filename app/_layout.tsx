
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider as CustomThemeProvider } from '@/contexts/ThemeContext';
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext';
import { WidgetProvider } from '@/contexts/WidgetContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { serverHealthMonitor } from '@/utils/expoServerHealth';
import { metroConnectionGuard, setupMetroErrorHandler } from '@/utils/metroConnectionGuard';
import { startupValidator } from '@/utils/expoStartupValidator';

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
  serverHealthMonitor.initialize().catch((error) => {
    console.log('[Startup] Failed to initialize server health monitor:', error);
  });

  // Initialize Metro connection guard
  metroConnectionGuard.initialize().catch((error) => {
    console.log('[Startup] Failed to initialize Metro connection guard:', error);
  });

  // Set up Metro error handler
  setupMetroErrorHandler();

  // Run startup validation
  startupValidator.validate().then((validation) => {
    if (!validation.isValid) {
      console.log('[Startup] ⚠️ Some startup checks failed, but continuing...');
    }
  });

  // Log diagnostics
  startupValidator.logDiagnostics();

  // Global error handler for unhandled promise rejections
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

  console.log('[Startup] ✅ Expo server stability systems initialized');
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      
      // Mark Metro connection as successful after app loads
      if (__DEV__) {
        metroConnectionGuard.markConnectionSuccess();
        console.log('[Startup] ✅ App loaded successfully');
      }
    }
  }, [loaded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (__DEV__) {
        serverHealthMonitor.cleanup();
        console.log('[Startup] Cleaned up server health monitor');
      }
    };
  }, []);

  if (!loaded) {
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
              </ThemeProvider>
            </WidgetProvider>
          </UserPreferencesProvider>
        </AuthProvider>
      </CustomThemeProvider>
    </ErrorBoundary>
  );
}
