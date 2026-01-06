
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  // Show loading spinner while checking session
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Redirect to onboarding if no session
  if (!session) {
    return <Redirect href="/onboarding" />;
  }

  // Render children if authenticated
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
