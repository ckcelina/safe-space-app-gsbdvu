
/**
 * Theme Types
 * 
 * Type definitions for theme-related functionality.
 */

import type { ThemeKey, Theme } from '@/contexts/ThemeContext';

/**
 * Re-export theme types for convenience
 */
export type { ThemeKey, Theme };

/**
 * Theme-aware style function
 */
export type ThemeStyleFunction<T> = (theme: Theme) => T;

