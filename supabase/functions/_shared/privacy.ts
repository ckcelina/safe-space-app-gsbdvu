
/**
 * Privacy utilities for Safe Space edge functions
 * Ensures sensitive data is never logged in production
 */

/**
 * Redacts sensitive message content from logs
 * @param content - The message content to redact
 * @returns Redacted string safe for logging
 */
export function redactMessageContent(content: string): string {
  if (!content) return '[empty]';
  const length = content.length;
  return `[REDACTED: ${length} chars]`;
}

/**
 * Redacts user identifiable information
 * @param userId - User ID to redact
 * @returns Redacted user ID
 */
export function redactUserId(userId: string): string {
  if (!userId) return '[no-user]';
  return `user_${userId.substring(0, 8)}...`;
}

/**
 * Safe error logging that redacts sensitive data
 * @param context - Context of the error
 * @param error - The error object
 * @param metadata - Additional metadata (will be redacted if contains sensitive keys)
 */
export function logError(context: string, error: any, metadata?: Record<string, any>) {
  const safeMetadata = metadata ? redactSensitiveFields(metadata) : {};
  
  console.error(`[${context}]`, {
    error: error?.message || String(error),
    ...safeMetadata,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Redacts sensitive fields from an object
 * @param obj - Object that may contain sensitive data
 * @returns Object with sensitive fields redacted
 */
export function redactSensitiveFields(obj: Record<string, any>): Record<string, any> {
  const sensitiveKeys = ['content', 'message', 'text', 'messages', 'password', 'token', 'key', 'reply'];
  const redacted: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      if (typeof value === 'string') {
        redacted[key] = redactMessageContent(value);
      } else if (Array.isArray(value)) {
        redacted[key] = `[REDACTED: ${value.length} items]`;
      } else {
        redacted[key] = '[REDACTED]';
      }
    } else {
      redacted[key] = value;
    }
  }
  
  return redacted;
}

/**
 * Safe info logging for non-sensitive operational data
 * @param context - Context of the log
 * @param data - Data to log (will be checked for sensitive fields)
 */
export function logInfo(context: string, data?: Record<string, any>) {
  const safeData = data ? redactSensitiveFields(data) : {};
  console.log(`[${context}]`, {
    ...safeData,
    timestamp: new Date().toISOString(),
  });
}
