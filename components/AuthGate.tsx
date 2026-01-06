
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  // OPTIMIZATION: Only show loading for a brief moment
  // If loading takes too long, show content anyway to prevent blocking
  const [showLoading, setShowLoading] = React.useState(true);

  React.useEffect(() => {
    // Hide loading screen after 500ms even if still loading
    // This prevents indefinite blocking on slow networks
    const timeout = setTimeout(() => {
      setShowLoading(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  // Show loading spinner only briefly
  if (loading && showLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Redirect to onboarding if no session
  if (!session && !loading) {
    return <Redirect href="/onboarding" />;
  }

  // Render children if authenticated or still loading (after timeout)
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
