
/**
 * Loading State Component
 * 
 * Reusable component for displaying loading states.
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';

export interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

/**
 * Loading state component
 * 
 * @param message - Optional message to display
 * @param size - Size of the activity indicator (default: 'large')
 * @param fullScreen - Whether to take full screen (default: false)
 */
export function LoadingState({ 
  message, 
  size = 'large',
  fullScreen = false 
}: LoadingStateProps) {
  const { theme } = useThemeContext();

  const containerStyle = fullScreen ? styles.fullScreen : styles.container;

  return (
    <View style={[containerStyle, { backgroundColor: theme.background }]}>
      <ActivityIndicator size={size} color={theme.primary} />
      {message && (
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});

