
import { format, isValid, parseISO } from 'date-fns';

/**
 * Safely parse a timestamp into a Date object
 * @param timestamp - Can be string, number, Date, null, or undefined
 * @returns Valid Date object or null
 */
export function safeParseDate(timestamp: string | number | Date | null | undefined): Date | null {
  if (!timestamp) return null;
  
  try {
    let date: Date;
    
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = parseISO(timestamp);
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return null;
    }
    
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
}

/**
 * Safely format a timestamp with a fallback
 * @param timestamp - Can be string, number, Date, null, or undefined
 * @param formatString - date-fns format string
 * @param fallback - Fallback string if timestamp is invalid
 * @returns Formatted date string or fallback
 */
export function safeFormatDate(
  timestamp: string | number | Date | null | undefined,
  formatString: string = 'h:mm a',
  fallback: string = ''
): string {
  const date = safeParseDate(timestamp);
  if (!date) return fallback;
  
  try {
    return format(date, formatString);
  } catch {
    return fallback;
  }
}
