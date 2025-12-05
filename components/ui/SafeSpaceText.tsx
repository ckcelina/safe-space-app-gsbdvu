
import React, { ReactNode } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';

interface SafeSpaceTextProps {
  children: ReactNode;
  variant?: 'title' | 'subtitle' | 'body' | 'caption';
  style?: TextStyle;
  color?: string;
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
}

export function SafeSpaceTitle({
  children,
  style,
  color,
  align = 'center',
  numberOfLines,
}: Omit<SafeSpaceTextProps, 'variant'>) {
  const { colors } = useThemeContext();
  return (
    <Text
      style={[
        styles.title,
        { color: color || colors.text, textAlign: align },
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}

export function SafeSpaceSubtitle({
  children,
  style,
  color,
  align = 'center',
  numberOfLines,
}: Omit<SafeSpaceTextProps, 'variant'>) {
  const { colors } = useThemeContext();
  return (
    <Text
      style={[
        styles.subtitle,
        { color: color || colors.textSecondary, textAlign: align },
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}

export function SafeSpaceBody({
  children,
  style,
  color,
  align = 'left',
  numberOfLines,
}: Omit<SafeSpaceTextProps, 'variant'>) {
  const { colors } = useThemeContext();
  return (
    <Text
      style={[
        styles.body,
        { color: color || colors.text, textAlign: align },
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}

export function SafeSpaceCaption({
  children,
  style,
  color,
  align = 'left',
  numberOfLines,
}: Omit<SafeSpaceTextProps, 'variant'>) {
  const { colors } = useThemeContext();
  return (
    <Text
      style={[
        styles.caption,
        { color: color || colors.textSecondary, textAlign: align },
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
  },
});
