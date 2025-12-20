
import { Platform } from 'react-native';

/**
 * Standardized layout constants for consistent header heights and spacing
 */
export const HEADER_HEIGHT = Platform.OS === 'android' ? 60 : 60;
export const HEADER_PADDING_HORIZONTAL = 20;
export const HEADER_TITLE_SIZE = 24;
