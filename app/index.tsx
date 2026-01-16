
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';

export default function IndexScreen() {
  const { user, loading } = useAuth();
  const { theme } = useThemeContext();

  useEffect(() => {
    if (!loading) {
      console.log('[Index] Auth loading complete. User:', user ? 'Logged in' : 'Not logged in');
      
      if (user) {
        // User is logged in, go to home
        console.log('[Index] Redirecting to home...');
        router.replace('/(tabs)/(home)');
      } else {
        // User is not logged in, go to onboarding
        console.log('[Index] Redirecting to onboarding...');
        router.replace('/onboarding');
      }
    }
  }, [user, loading]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
