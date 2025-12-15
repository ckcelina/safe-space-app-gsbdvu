
import React, { useState } from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  TextInputProps,
  ViewStyle,
  Platform,
} from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';

interface SafeSpaceTextInputProps extends TextInputProps {
  containerStyle?: ViewStyle;
  /**
   * Show a clear focus indicator when the input is active
   * Default: true
   */
  showFocusIndicator?: boolean;
}

/**
 * Themed TextInput with clear focus states and consistent styling.
 * 
 * FOCUS CLARITY:
 * - Border color changes when focused
 * - Border width increases when focused
 * - Cursor is always visible
 * - User always knows which field is active
 */
export function SafeSpaceTextInput({
  containerStyle,
  style,
  showFocusIndicator = true,
  ...props
}: SafeSpaceTextInputProps) {
  const { theme } = useThemeContext();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.card,
            color: theme.textPrimary,
            borderColor: isFocused && showFocusIndicator ? theme.primary : theme.textSecondary + '40',
            borderWidth: isFocused && showFocusIndicator ? 2 : 1,
          },
          style,
        ]}
        placeholderTextColor={theme.textSecondary}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        cursorColor={theme.primary}
        selectionColor={Platform.OS === 'ios' ? theme.primary : theme.primary + '40'}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 52,
  },
});
