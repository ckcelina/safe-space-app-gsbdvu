
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useThemeContext } from '@/contexts/ThemeContext';
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext';
import { WidgetProvider } from '@/contexts/WidgetContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HydrationGate } from '@/components/HydrationGate';
import { prefetchAllAvatars } from '@/lib/avatarPrefetch';

/**
 * Inner Layout Component
 *
 * Renders INSIDE providers so it can access auth and theme context.
 * Uses HydrationGate to prevent screens from rendering before providers are ready.
 */
function LayoutContent() {
  const { loading: authLoading } = useAuth();
  const { isHydrated: themeHydrated } = useThemeContext();

  // Prefetch all therapist avatars on app start (non-blocking)
  useEffect(() => {
    console.log('[App] Initializing app...');

    // Prefetch avatars in the background
    prefetchAllAvatars().catch((error) => {
      console.warn('[App] Avatar prefetch failed (non-critical):', error);
    });
  }, []);

  return (
    <HydrationGate authLoading={authLoading} themeHydrated={themeHydrated}>
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
    </HydrationGate>
  );
}

/**
 * Root Layout Component
 *
 * Provider hierarchy (NEVER conditionally mount/unmount):
 * 1. GestureHandlerRootView (gestures)
 * 2. ErrorBoundary (error handling)
 * 3. AuthProvider (auth state)
 * 4. ThemeProvider (theme state)
 * 5. HydrationGate (waits for auth + theme)
 * 6. UserPreferencesProvider (user prefs)
 * 7. WidgetProvider (widget state)
 * 8. Stack (routing)
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <AuthProvider>
          <ThemeProvider>
            <LayoutContent />
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
