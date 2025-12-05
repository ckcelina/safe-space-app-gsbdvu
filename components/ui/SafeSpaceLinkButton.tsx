
import React, { ReactNode } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';

interface SafeSpaceLinkButtonProps {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function SafeSpaceLinkButton({
  children,
  onPress,
  disabled = false,
  style,
  textStyle,
}: SafeSpaceLinkButtonProps) {
  const { colors } = useThemeContext();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.container, style]}
    >
      <Text style={[styles.text, { color: colors.primary }, textStyle]}>
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
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
