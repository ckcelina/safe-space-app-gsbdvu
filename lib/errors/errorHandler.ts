
/**
 * Centralized Error Handling System
 * 
 * Provides consistent error handling patterns across the app,
 * including error types, handlers, and user-friendly messages.
 */

/**
 * App-specific error class with structured error information
 */
export class AppError extends Error {
  code: string;
  userMessage: string;
  statusCode?: number;
  originalError?: any;
  context?: Record<string, any>;

  constructor(
    code: string,
    message: string,
    userMessage?: string,
    options?: {
      statusCode?: number;
      originalError?: any;
      context?: Record<string, any>;
    }
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage || message;
    this.statusCode = options?.statusCode;
    this.originalError = options?.originalError;
    this.context = options?.context;
  }
}

/**
 * Error codes used throughout the app
 */
export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  
  // Authentication errors
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  
  // API errors
  API_ERROR = 'API_ERROR',
  API_NOT_FOUND = 'API_NOT_FOUND',
  API_UNAUTHORIZED = 'API_UNAUTHORIZED',
  API_FORBIDDEN = 'API_FORBIDDEN',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  
  // Supabase errors
  SUPABASE_ERROR = 'SUPABASE_ERROR',
  SUPABASE_QUERY_ERROR = 'SUPABASE_QUERY_ERROR',
  SUPABASE_RLS_ERROR = 'SUPABASE_RLS_ERROR',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Unknown errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Handle Supabase errors and convert to AppError
 */
export function handleSupabaseError(error: any): AppError {
  if (!error) {
    return new AppError(
      ErrorCode.UNKNOWN_ERROR,
      'An unknown error occurred',
      'Something went wrong. Please try again.'
    );
  }

  // Handle PostgrestError
  if (error.code) {
    const code = error.code;
    const message = error.message || 'Database error';
    
    // RLS policy violation
    if (code === '42501' || message.includes('row-level security')) {
      return new AppError(
        ErrorCode.SUPABASE_RLS_ERROR,
        message,
        'You don\'t have permission to perform this action.',
        { statusCode: 403, originalError: error }
      );
    }
    
    // Not found
    if (code === 'PGRST116' || message.includes('No rows')) {
      return new AppError(
        ErrorCode.API_NOT_FOUND,
        message,
        'The requested item was not found.',
        { statusCode: 404, originalError: error }
      );
    }
    
    // Foreign key violation
    if (code === '23503') {
      return new AppError(
        ErrorCode.VALIDATION_ERROR,
        message,
        'This action cannot be completed because it references invalid data.',
        { statusCode: 400, originalError: error }
      );
    }
    
    // Unique constraint violation
    if (code === '23505') {
      return new AppError(
        ErrorCode.VALIDATION_ERROR,
        message,
        'This item already exists.',
        { statusCode: 409, originalError: error }
      );
    }
    
    // Generic database error
    return new AppError(
      ErrorCode.SUPABASE_QUERY_ERROR,
      message,
      'A database error occurred. Please try again.',
      { statusCode: 500, originalError: error }
    );
  }
  
  // Handle network errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return new AppError(
      ErrorCode.NETWORK_ERROR,
      error.message,
      'Network error. Please check your connection and try again.',
      { originalError: error }
    );
  }
  
  // Handle timeout errors
  if (error.message?.includes('timeout') || error.name === 'TimeoutError') {
    return new AppError(
      ErrorCode.TIMEOUT,
      error.message,
      'Request timed out. Please try again.',
      { originalError: error }
    );
  }
  
  // Default: return as AppError with original error
  return new AppError(
    ErrorCode.SUPABASE_ERROR,
    error.message || 'Supabase error',
    'An error occurred. Please try again.',
    { originalError: error }
  );
}

/**
 * Handle API errors and convert to AppError
 */
export function handleAPIError(error: any): AppError {
  if (!error) {
    return new AppError(
      ErrorCode.UNKNOWN_ERROR,
      'An unknown error occurred',
      'Something went wrong. Please try again.'
    );
  }
  
  // If it's already an AppError, return it
  if (error instanceof AppError) {
    return error;
  }
  
  // Handle HTTP status codes
  const status = error.status || error.statusCode || error.response?.status;
  
  if (status === 401) {
    return new AppError(
      ErrorCode.AUTH_REQUIRED,
      error.message || 'Unauthorized',
      'Please sign in to continue.',
      { statusCode: 401, originalError: error }
    );
  }
  
  if (status === 403) {
    return new AppError(
      ErrorCode.API_FORBIDDEN,
      error.message || 'Forbidden',
      'You don\'t have permission to perform this action.',
      { statusCode: 403, originalError: error }
    );
  }
  
  if (status === 404) {
    return new AppError(
      ErrorCode.API_NOT_FOUND,
      error.message || 'Not found',
      'The requested resource was not found.',
      { statusCode: 404, originalError: error }
    );
  }
  
  if (status === 429) {
    return new AppError(
      ErrorCode.API_RATE_LIMIT,
      error.message || 'Rate limit exceeded',
      'Too many requests. Please wait a moment and try again.',
      { statusCode: 429, originalError: error }
    );
  }
  
  if (status >= 500) {
    return new AppError(
      ErrorCode.API_ERROR,
      error.message || 'Server error',
      'A server error occurred. Please try again later.',
      { statusCode: status, originalError: error }
    );
  }
  
  // Handle network errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return new AppError(
      ErrorCode.NETWORK_ERROR,
      error.message,
      'Network error. Please check your connection and try again.',
      { originalError: error }
    );
  }
  
  // Default
  return new AppError(
    ErrorCode.API_ERROR,
    error.message || 'API error',
    'An error occurred. Please try again.',
    { statusCode: status, originalError: error }
  );
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: Error | AppError | any): string {
  if (error instanceof AppError) {
    return error.userMessage;
  }
  
  if (error?.userMessage) {
    return error.userMessage;
  }
  
  if (error?.message) {
    // Return a generic message for non-AppError errors in production
    if (!__DEV__) {
      return 'Something went wrong. Please try again.';
    }
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Log error with context (DEV only)
 */
export function logError(error: Error | AppError | any, context?: Record<string, any>): void {
  if (!__DEV__) {
    return;
  }
  
  const errorInfo: any = {
    message: error?.message || 'Unknown error',
    stack: error?.stack,
  };
  
  if (error instanceof AppError) {
    errorInfo.code = error.code;
    errorInfo.statusCode = error.statusCode;
    errorInfo.context = error.context;
  }
  
  if (context) {
    errorInfo.context = { ...errorInfo.context, ...context };
  }
  
  console.error('[Error Handler]', errorInfo);
}

