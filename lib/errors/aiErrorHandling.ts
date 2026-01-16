
/**
 * AI Error Handling Utilities
 * 
 * Provides structured error logging, transient error detection, and retry logic
 * specifically for AI generation failures.
 */

/**
 * Check if an error is transient and should be retried
 * 
 * Transient errors include:
 * - Network errors (timeout, connection failed)
 * - HTTP 503 (Service Unavailable)
 * - HTTP 502 (Bad Gateway)
 * - HTTP 504 (Gateway Timeout)
 * - HTTP 429 (Rate Limit)
 * - EMPTY_ASSISTANT_RESPONSE (AI returned empty/null response)
 */
export function isTransientAIError(error: any): boolean {
  const status = error?.status || error?.error?.status;
  const code = error?.code || error?.error?.code;
  const message = (error?.message || error?.error?.message || '').toLowerCase();
  
  // Check for empty assistant response - treat as transient
  if (message.includes('empty_assistant_response')) {
    return true;
  }
  
  // Check status codes
  if (status === 429 || status === 502 || status === 503 || status === 504) {
    return true;
  }
  
  // Check error codes
  if (code === 'EDGE_TIMEOUT' || code === 'EDGE_UNAVAILABLE' || code === 'EDGE_ABORTED') {
    return true;
  }
  
  // Check error messages
  if (
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('connection') ||
    message.includes('rate limit')
  ) {
    return true;
  }
  
  return false;
}

/**
 * Log structured error information (DEV only)
 * 
 * @param stage - The stage where the error occurred
 * @param error - The error object (normalized from invokeEdgeSafe or raw)
 * @param context - Additional context information
 */
export function logAIError(
  stage: 'AI_REQUEST' | 'EDGE_FUNCTION_INVOKE' | 'OPENAI_RESPONSE_PARSE' | 'AI_RETRY',
  error: any,
  context?: {
    conversationId?: string;
    personId?: string;
    userId?: string;
    messageCount?: number;
    attempt?: number;
  }
): void {
  // Build a comprehensive error message from all possible sources
  const message = 
    error?.message || 
    error?.error?.message || 
    error?.details || 
    (error && typeof error === 'object' ? JSON.stringify(error) : null) || 
    'Unknown error';
  
  // Extract error fields from normalized error structure
  const code = error?.code ?? error?.error?.code ?? error?.name ?? undefined;
  const status = error?.status ?? error?.error?.status ?? undefined;
  
  // Build the base payload
  const payload: any = {
    stage,
    message,
    timestamp: new Date().toISOString(),
  };
  
  // Add optional fields only if they exist
  if (code !== undefined) {
    payload.code = code;
  }
  
  if (status !== undefined) {
    payload.status = status;
  }
  
  // Add context if provided
  if (context) {
    payload.context = context;
  }
  
  // DEV-only: Add verbose fields including bodySnippet
  if (__DEV__) {
    // Extract response body snippet if available
    let bodySnippet: string | null = null;
    
    try {
      // Check details.bodySnippet first (from invokeEdgeSafe)
      if (error?.details?.bodySnippet) {
        bodySnippet = error.details.bodySnippet;
      }
      // Check details.body
      else if (error?.details?.body) {
        const bodyStr = typeof error.details.body === 'string' 
          ? error.details.body 
          : JSON.stringify(error.details.body);
        bodySnippet = bodyStr.substring(0, 500);
      }
      // Check details.context
      else if (error?.details?.context) {
        const contextStr = typeof error.details.context === 'string'
          ? error.details.context
          : JSON.stringify(error.details.context);
        bodySnippet = contextStr.substring(0, 500);
      }
      // Check error.data
      else if (error?.data) {
        const dataStr = typeof error.data === 'string'
          ? error.data
          : JSON.stringify(error.data);
        bodySnippet = dataStr.substring(0, 500);
      }
      // Check error.error.data
      else if (error?.error?.data) {
        const dataStr = typeof error.error.data === 'string'
          ? error.error.data
          : JSON.stringify(error.error.data);
        bodySnippet = dataStr.substring(0, 500);
      }
      // Try to stringify the entire error object as last resort
      else if (error && typeof error === 'object') {
        const errorStr = JSON.stringify(error);
        bodySnippet = errorStr.substring(0, 500);
      }
    } catch (e) {
      bodySnippet = '[Error stringifying body]';
    }
    
    if (bodySnippet !== null) {
      payload.bodySnippet = bodySnippet;
    }
  }
  
  console.error(`[${stage}]`, payload);
}

/**
 * Generate a random delay with jitter for retry backoff
 * 
 * @param minMs - Minimum delay in milliseconds
 * @param maxMs - Maximum delay in milliseconds
 * @returns Random delay between min and max
 */
export function getRetryDelay(minMs: number = 600, maxMs: number = 1200): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

/**
 * Format error message for display
 * 
 * @param error - The error object
 * @param isDev - Whether to show detailed error (DEV mode)
 * @returns User-friendly error message
 */
export function formatAIErrorMessage(error: any, isDev: boolean = false): string {
  const status = error?.status || error?.error?.status;
  const code = error?.code || error?.error?.code;
  const message = error?.message || error?.error?.message || 'Unknown error';
  if (isDev) {
    // DEV: Show detailed error with status and code
    const formatted = `Error: ${status || code || 'UNKNOWN'} ${message}`;
    return formatted;
  }
  
  // PROD: Show friendly message
  const formatted = "I'm having trouble responding right now. Tap to retry.";
  return formatted;
}

/**
 * Extract assistant text from various response formats
 * 
 * This function normalizes AI responses from different sources and ensures
 * we always get a valid string or throw an error.
 * 
 * Supported formats:
 * - Direct string
 * - { content: string }
 * - { text: string }
 * - { message: { content: string } }
 * - { message: { text: string } }
 * - { data: { content: string } }
 * - { data: { text: string } }
 * - { choices: [{ message: { content: string } }] }
 * - { reply: string } (our Edge Function format)
 * 
 * @param result - The AI response result
 * @param context - Additional context for error logging (DEV-only)
 * @returns The extracted text string
 * @throws Error with code "EMPTY_ASSISTANT_RESPONSE" if no valid text is found
 */
export function extractAssistantText(
  result: any,
  context?: {
    conversationId?: string;
    personId?: string;
    userId?: string;
    messageCount?: number;
    attempt?: number;
  }
): string {
  // DEV-only: Log the raw response shape for diagnosis
  if (__DEV__) {
    console.log('[extractAssistantText] Raw response shape:', {
      type: typeof result,
      keys: result && typeof result === 'object' ? Object.keys(result) : null,
      hasReply: result?.reply !== undefined,
      hasContent: result?.content !== undefined,
      hasData: result?.data !== undefined,
      context,
    });
  }

  // If result is a string, use it directly
  if (typeof result === 'string') {
    const trimmed = result.trim();
    if (!trimmed) {
      const error = new Error('EMPTY_ASSISTANT_RESPONSE');
      (error as any).code = 'EMPTY_ASSISTANT_RESPONSE';
      (error as any).context = context;
      
      if (__DEV__) {
        logAIError('OPENAI_RESPONSE_PARSE', error, context);
      }
      
      throw error;
    }
    return trimmed;
  }

  // Check various possible locations for the text
  const possiblePaths = [
    result?.reply, // Our Edge Function returns { reply: "..."}
    result?.content,
    result?.text,
    result?.message?.content,
    result?.message?.text,
    result?.data?.content,
    result?.data?.text,
    result?.choices?.[0]?.message?.content,
  ];

  for (const path of possiblePaths) {
    if (typeof path === 'string') {
      const trimmed = path.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  // No valid text found - throw structured error
  const error = new Error('EMPTY_ASSISTANT_RESPONSE');
  (error as any).code = 'EMPTY_ASSISTANT_RESPONSE';
  (error as any).context = context;
  (error as any).responseShape = __DEV__ ? JSON.stringify(result).substring(0, 500) : undefined;
  
  if (__DEV__) {
    logAIError('OPENAI_RESPONSE_PARSE', error, context);
  }
  
  throw error;
}

