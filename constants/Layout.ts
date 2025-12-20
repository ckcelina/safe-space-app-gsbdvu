
import { Platform } from 'react-native';

/**
 * Standardized layout constants for consistent header heights and spacing
 */
export const HEADER_HEIGHT = Platform.OS === 'android' ? 60 : 60;
export const HEADER_PADDING_HORIZONTAL = 20;
export const HEADER_TITLE_SIZE = 24;

/**
 * Header button styles for consistent appearance across all screens
 * These ensure buttons are always visible against gradient backgrounds
 */
export const HEADER_BUTTON_STYLES = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 4,
};
