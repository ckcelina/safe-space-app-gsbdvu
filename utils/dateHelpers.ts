
import { format, parseISO } from 'date-fns';

/**
 * Safely parse a timestamp that could be Date, number, string, or undefined
 * Returns null if the timestamp is invalid
 */
export const safeParseDate = (timestamp: Date | number | string | null | undefined): Date | null => {
  if (!timestamp) return null;

  let dateObj: Date;

  if (typeof timestamp === 'string') {
    try {
      // Try parsing as ISO string first
      dateObj = parseISO(timestamp);
    } catch {
      return null;
    }
  } else if (timestamp instanceof Date) {
    // Already a Date object
    dateObj = timestamp;
  } else {
    // Number (timestamp in milliseconds)
    dateObj = new Date(timestamp);
  }

  // Validate the date
  return !isNaN(dateObj.getTime()) ? dateObj : null;
};

/**
 * Safely format a date, returning fallback string if invalid
 * Accepts Date object, number, string, or undefined
 */
export const safeFormatDate = (
  timestamp: Date | number | string | null | undefined,
  formatString: string = 'h:mm a',
  fallback: string = ''
): string => {
  // Parse the timestamp if it's not already a Date object
  const date = timestamp instanceof Date ? timestamp : safeParseDate(timestamp);
  
  if (!date) return fallback;
  
  try {
    return format(date, formatString);
  } catch {
    return fallback;
  }
};
