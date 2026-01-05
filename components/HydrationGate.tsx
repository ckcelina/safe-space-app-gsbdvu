/**
 * Hydration Gate Component
 *
 * Prevents screens from rendering before providers (Auth, Theme) are ready.
 * This prevents "useAuth must be used within AuthProvider" and similar errors.
 *
 * Shows a loading screen while:
 * - Auth is loading session from SecureStore
 * - Theme is loading from AsyncStorage
 *
 * Only renders children when both are hydrated.
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeSpaceLogo } from './SafeSpaceLogo';

interface HydrationGateProps {
  authLoading: boolean;
  themeHydrated: boolean;
  children: React.ReactNode;
}

export function HydrationGate({ authLoading, themeHydrated, children }: HydrationGateProps) {
  // Wait for both auth and theme to be ready
  const isHydrating = authLoading || !themeHydrated;

  if (isHydrating) {
    console.log('[HydrationGate] Waiting for providers...', {
      authLoading,
      themeHydrated,
    });

    return (
      <View style={styles.container}>
        <SafeSpaceLogo size={120} useGradient />
        <ActivityIndicator
          size="large"
          color="#1890FF"
          style={styles.spinner}
        />
      </View>
    );
  }

  console.log('[HydrationGate] Providers ready, rendering app');
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    marginTop: 24,
  },
});
