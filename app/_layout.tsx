
import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useThemeContext } from '@/contexts/ThemeContext';
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext';
import { WidgetProvider } from '@/contexts/WidgetContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { prefetchAllAvatars } from '@/lib/avatarPrefetch';
import { logError } from '@/lib/errors/errorHandler';
import { serverHealthMonitor } from '@/utils/expoServerHealth';
import { metroConnectionGuard, setupMetroErrorHandler } from '@/utils/metroConnectionGuard';

// Hydration gate: prevent screens from rendering before providers are ready
// This fixes "useAuth must be used within AuthProvider" and LinearGradient crashes
function NavigationContent() {
  const { isHydrated } = useAuth();
  const { themeReady, theme } = useThemeContext();

  // Show loading screen with safe fallback gradient while providers hydrate
  if (!isHydrated || !themeReady) {
    return (
      <View style={{ flex: 1, backgroundColor: theme?.background || '#E6F7FF' }} />
    );
  }

  // Providers are ready - safe to render navigation
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="theme-selection" options={{ headerShown: false }} />
      <Stack.Screen name="ai-preferences-onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="transparent-modal" options={{ presentation: 'transparentModal', headerShown: false }} />
      <Stack.Screen name="formsheet" options={{ presentation: 'formSheet', headerShown: false }} />
      <Stack.Screen name="legal/terms-of-service" options={{ headerShown: false }} />
      <Stack.Screen name="legal/privacy-policy" options={{ headerShown: false }} />
      <Stack.Screen name="legal/terms-summary" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  // Prefetch all therapist avatars on app start
  useEffect(() => {
    console.log('[App] Initializing app...');
    console.log('[DEBUG] __DEV__ =', __DEV__);
    console.log('[DEBUG] Platform =', Platform.OS);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',mode:'no-cors',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_layout.tsx:56',message:'App init log',data:{platform:Platform.OS,isDev:__DEV__},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    const errorUtils = (global as any)?.ErrorUtils;
    if (errorUtils?.setGlobalHandler) {
      const existingHandler = errorUtils.getGlobalHandler?.();
      errorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
        if (existingHandler) {
          existingHandler(error, isFatal);
        }
      });
    }
    // Initialize Expo server health monitoring (always run in dev mode)
    if (__DEV__) {
      (async () => {
        try {
          console.log('[App] Initializing Expo server stability systems...');
          setupMetroErrorHandler();
          await metroConnectionGuard.initialize();
          await serverHealthMonitor.initialize();
          console.log('[App] ✅ Expo server stability systems initialized');
        } catch (error) {
          console.warn('[App] ⚠️ Failed to initialize Expo stability systems:', error);
        }
      })();
    }

    // Prefetch avatars in the background
    prefetchAllAvatars().catch((error) => {
      console.warn('[App] Avatar prefetch failed (non-critical):', error);
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          logError(error, { componentStack: errorInfo.componentStack });
        }}
      >
        <AuthProvider>
          <ThemeProvider>
            <UserPreferencesProvider>
              <WidgetProvider>
                <NavigationContent />
              </WidgetProvider>
            </UserPreferencesProvider>
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
