
/**
 * Empty State Component
 * 
 * Reusable component for displaying empty states.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';

export interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Empty state component
 * 
 * @param title - Title text
 * @param message - Optional message text
 * @param icon - Optional icon name
 * @param actionLabel - Optional action button label
 * @param onAction - Optional action button handler
 */
export function EmptyState({
  title,
  message,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { theme } = useThemeContext();

  return (
    <View style={styles.container}>
      {icon && (
        <IconSymbol
          name={icon}
          size={48}
          color={theme.textSecondary}
          style={styles.icon}
        />
      )}
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        {title}
      </Text>
      {message && (
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={onAction}
        >
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  icon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

