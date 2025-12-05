
import React, { ReactNode } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';

interface SafeSpaceLinkButtonProps {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'default' | 'outline';
}

export function SafeSpaceLinkButton({
  children,
  onPress,
  disabled = false,
  style,
  textStyle,
  variant = 'default',
}: SafeSpaceLinkButtonProps) {
  const { theme } = useThemeContext();

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        style={[
          styles.outlineContainer,
          { 
            borderColor: theme.primary,
            backgroundColor: theme.card,
          },
          style,
        ]}
      >
        <Text style={[styles.outlineText, { color: theme.primary }, textStyle]}>
          {children}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.container, style]}
    >
      <Text style={[styles.text, { color: theme.primary }, textStyle]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  outlineContainer: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderRadius: 50,
    borderWidth: 2,
    marginBottom: 16,
  },
  outlineText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
