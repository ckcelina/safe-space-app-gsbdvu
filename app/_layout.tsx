
import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
import * as Network from 'expo-network';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useThemeContext } from '@/contexts/ThemeContext';
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext';
import { WidgetProvider } from '@/contexts/WidgetContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { prefetchAllAvatars } from '@/lib/avatarPrefetch';
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
    fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_layout.tsx:52',message:'App initialization started',data:{isDev:__DEV__,platform:Platform.OS},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

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

    // Debug Expo connection - test all hypotheses
    (async () => {
      try {
        console.log('[DEBUG] Starting Expo connection diagnostics...');
        // Hypothesis A: Check __DEV__ mode
        console.log('[DEBUG] Hypothesis A: __DEV__ =', __DEV__, 'Platform =', Platform.OS, 'Version =', Platform.Version);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_layout.tsx:58',message:'Hypothesis A: Dev mode check',data:{isDev:__DEV__,platform:Platform.OS,platformVersion:Platform.Version},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        // Hypothesis D: Check Expo Constants for connection info
        console.log('[DEBUG] Hypothesis D: Expo Constants - hasExpoConfig:', !!Constants.expoConfig, 'debuggerHost:', Constants.manifest?.debuggerHost);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_layout.tsx:61',message:'Hypothesis D: Expo Constants check',data:{hasExpoConfig:!!Constants.expoConfig,appName:Constants.expoConfig?.name,appVersion:Constants.expoConfig?.version,manifestUrl:Constants.manifest?.originalFullUrl,debuggerHost:Constants.manifest?.debuggerHost},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion

        // Hypothesis C: Check network connectivity
        try {
          const networkState = await Network.getNetworkStateAsync();
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_layout.tsx:66',message:'Hypothesis C: Network state check',data:{isConnected:networkState.isConnected,isInternetReachable:networkState.isInternetReachable,type:networkState.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
        } catch (networkError: any) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_layout.tsx:69',message:'Hypothesis C: Network check failed',data:{error:networkError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
        }

        // Hypothesis B: Try to initialize Expo server health monitor
        console.log('[DEBUG] Hypothesis B: Initializing server health monitor...');
        try {
          await serverHealthMonitor.initialize();
          console.log('[DEBUG] Hypothesis B: Server health monitor initialized successfully');
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_layout.tsx:75',message:'Hypothesis B: Server health monitor initialized',data:{success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
        } catch (healthError: any) {
          console.error('[DEBUG] Hypothesis B: Server health monitor init failed:', healthError);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_layout.tsx:78',message:'Hypothesis B: Server health monitor init failed',data:{error:healthError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
        }

        // Initialize Metro connection guard
        try {
          setupMetroErrorHandler();
          await metroConnectionGuard.initialize();
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_layout.tsx:85',message:'Metro connection guard initialized',data:{success:true,status:metroConnectionGuard.getStatus()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
        } catch (metroError: any) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_layout.tsx:88',message:'Metro connection guard init failed',data:{error:metroError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
        }

        // Hypothesis E: Try to connect to Metro bundler (check if server is reachable)
        const debuggerHost = Constants.manifest?.debuggerHost || 'localhost:8081';
        const metroUrl = `http://${debuggerHost}/status`;
        console.log('[DEBUG] Hypothesis E: Testing Metro bundler connection to:', metroUrl);
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const response = await fetch(metroUrl, { method: 'GET', signal: controller.signal });
          clearTimeout(timeoutId);
          console.log('[DEBUG] Hypothesis E: Metro bundler connection SUCCESS - status:', response.status, response.statusText);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_layout.tsx:115',message:'Hypothesis E: Metro bundler connection test',data:{url:metroUrl,status:response.status,statusText:response.statusText,success:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
        } catch (metroConnError: any) {
          console.error('[DEBUG] Hypothesis E: Metro bundler connection FAILED - error:', metroConnError?.message, 'name:', metroConnError?.name);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_layout.tsx:118',message:'Hypothesis E: Metro bundler connection failed',data:{url:metroUrl,error:metroConnError?.message,errorName:metroConnError?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
        }
      } catch (error: any) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_layout.tsx:102',message:'Expo connection debug error',data:{error:error?.message,errorName:error?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'ALL'})}).catch(()=>{});
        // #endregion
      }
    })();

    // Prefetch avatars in the background
    prefetchAllAvatars().catch((error) => {
      console.warn('[App] Avatar prefetch failed (non-critical):', error);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/86105c35-01e6-4810-8ad5-4dfce4695369',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_layout.tsx:108',message:'Avatar prefetch error',data:{errorMessage:error?.message,errorName:error?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
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
