
import React from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';

interface SafeSpaceTextInputProps extends TextInputProps {
  containerStyle?: ViewStyle;
}

export function SafeSpaceTextInput({
  containerStyle,
  style,
  ...props
}: SafeSpaceTextInputProps) {
  const { theme } = useThemeContext();

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.card,
            color: theme.textPrimary,
            borderColor: theme.primary,
          },
          style,
        ]}
        placeholderTextColor={theme.textSecondary}
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
    borderWidth: 1,
  },
});
