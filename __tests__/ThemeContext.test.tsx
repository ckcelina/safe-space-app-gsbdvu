/**
 * Tests for ThemeContext
 */
import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { ThemeProvider, useThemeContext } from '../contexts/ThemeContext';

describe('ThemeContext', () => {
  it('should provide theme context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useThemeContext(), { wrapper });

    expect(result.current).toHaveProperty('theme');
    expect(result.current).toHaveProperty('themeKey');
    expect(result.current).toHaveProperty('setThemeKey');
  });

  it('should have default theme properties', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useThemeContext(), { wrapper });

    const { theme } = result.current;

    expect(theme).toHaveProperty('primary');
    expect(theme).toHaveProperty('background');
    expect(theme).toHaveProperty('textPrimary');
    expect(theme).toHaveProperty('textSecondary');
    expect(theme).toHaveProperty('card');
    expect(theme).toHaveProperty('primaryGradient');
    expect(theme).toHaveProperty('buttonText');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      renderHook(() => useThemeContext());
    }).toThrow('useThemeContext must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });
});
