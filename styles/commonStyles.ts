
/**
 * Common Style Patterns
 * 
 * Shared style utilities and common patterns used across the app.
 * These styles work with the theme system to provide consistent styling.
 */

import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import type { Theme } from '@/contexts/ThemeContext';

/**
 * Common container styles
 */
export const commonContainerStyles = {
  flex1: {
    flex: 1,
  } as ViewStyle,
  centerContent: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  } as ViewStyle,
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  } as ViewStyle,
  column: {
    flexDirection: 'column' as const,
  } as ViewStyle,
};

/**
 * Create theme-aware common styles
 */
export function createThemeStyles(theme: Theme) {
  return {
    container: {
      flex: 1,
      backgroundColor: theme.background,
    } as ViewStyle,
    
    content: {
      flex: 1,
      paddingHorizontal: 24,
    } as ViewStyle,
    
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.1)',
    } as ViewStyle,
    
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
    } as ViewStyle,
    
    button: {
      backgroundColor: theme.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    } as ViewStyle,
    
    buttonText: {
      color: theme.buttonText,
      fontSize: 16,
      fontWeight: '600' as const,
    } as TextStyle,
    
    textPrimary: {
      color: theme.textPrimary,
      fontSize: 16,
    } as TextStyle,
    
    textSecondary: {
      color: theme.textSecondary,
      fontSize: 14,
    } as TextStyle,
    
    input: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.1)',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.textPrimary,
    } as ViewStyle & TextStyle,
    
    divider: {
      height: 1,
      backgroundColor: 'rgba(0,0,0,0.1)',
      marginVertical: 16,
    } as ViewStyle,
    
    emptyState: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 32,
    } as ViewStyle,
    
    emptyStateText: {
      color: theme.textSecondary,
      fontSize: 16,
      textAlign: 'center' as const,
    } as TextStyle,
  };
}

/**
 * Common spacing values
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

/**
 * Common border radius values
 */
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

/**
 * Common font sizes
 */
export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

/**
 * Common font weights
 */
export const fontWeights = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/**
 * Helper function to create consistent padding styles
 */
export function padding(vertical?: number, horizontal?: number) {
  return {
    paddingVertical: vertical,
    paddingHorizontal: horizontal,
  };
}

/**
 * Helper function to create consistent margin styles
 */
export function margin(vertical?: number, horizontal?: number) {
  return {
    marginVertical: vertical,
    marginHorizontal: horizontal,
  };
}
