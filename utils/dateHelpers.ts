
import { parseISO, format, isValid } from 'date-fns';

/**
 * Safely parse a date from various input types
 * Returns null if the date is invalid or missing
 */
export const safeParseDate = (timestamp: string | number | Date | null | undefined): Date | null => {
  if (!timestamp) return null;
  
  try {
    let parsedDate: Date;
    
    if (typeof timestamp === 'string') {
      // Handle empty strings
      if (timestamp.trim() === '') return null;
      parsedDate = parseISO(timestamp);
    } else if (typeof timestamp === 'number') {
      parsedDate = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      parsedDate = timestamp;
    } else {
      return null;
    }
    
    return isValid(parsedDate) ? parsedDate : null;
  } catch (error) {
    console.warn('[dateHelpers] Error parsing date:', error);
    return null;
  }
};

/**
 * Safely format a date with a fallback for invalid dates
 * Returns empty string if date is invalid
 */
export const safeFormatDate = (
  date: Date | null | undefined, 
  formatStr: string = 'MMM dd, yyyy hh:mm a'
): string => {
  if (!date || !isValid(date)) return '';
  
  try {
    return format(date, formatStr);
  } catch (error) {
    console.warn('[dateHelpers] Error formatting date:', error);
    return '';
  }
};
