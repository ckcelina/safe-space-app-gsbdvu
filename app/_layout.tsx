
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext';
import { WidgetProvider } from '@/contexts/WidgetContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { prefetchAllAvatars } from '@/lib/avatarPrefetch';

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
  );
}
