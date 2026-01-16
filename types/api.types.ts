
/**
 * API Types
 * 
 * Type definitions for API requests and responses.
 */

/**
 * API error response
 */
export interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * API success response
 */
export interface APISuccessResponse<T = any> {
  success: true;
  data: T;
}

/**
 * API response union type
 */
export type APIResponse<T = any> = APISuccessResponse<T> | APIErrorResponse;

/**
 * Edge function request
 */
export interface EdgeFunctionRequest {
  [key: string]: any;
}

/**
 * Edge function response
 */
export interface EdgeFunctionResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

