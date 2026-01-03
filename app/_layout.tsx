
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Sentry from '@sentry/react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext';
import { WidgetProvider } from '@/contexts/WidgetContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { prefetchAllAvatars } from '@/lib/avatarPrefetch';

// ═══════════════════════════════════════════════════════════════════
// SENTRY ERROR TRACKING - Initialize before anything else
// ═══════════════════════════════════════════════════════════════════
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
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
  // Prefetch all therapist avatars on app start
  useEffect(() => {
    console.log('[App] Initializing app...');
    
    // Prefetch avatars in the background
    prefetchAllAvatars().catch((error) => {
      console.warn('[App] Avatar prefetch failed (non-critical):', error);
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <AuthProvider>
          <ThemeProvider>
            <UserPreferencesProvider>
              <WidgetProvider>
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
              </WidgetProvider>
            </UserPreferencesProvider>
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
