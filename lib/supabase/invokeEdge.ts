
/**
 * invokeEdge - Resilient Supabase Edge Function invocation helper
 * 
 * This helper wraps supabase.functions.invoke() with:
 * - Comprehensive error handling and normalization
 * - Detailed logging for debugging
 * - Consistent return format
 * - Never throws - always returns a result
 * 
 * @param functionName - Name of the Edge Function to invoke
 * @param payload - Request payload to send
 * @returns Object with { data, error, status }
 */

import { supabase } from '../supabase';

export interface InvokeEdgeError {
  name: string;
  message: string;
  status: number | null;
  details: string;
}

export interface InvokeEdgeResult<T = any> {
  data: T | null;
  error: InvokeEdgeError | null;
  status: number | null;
}

/**
 * Invoke a Supabase Edge Function with resilient error handling
 * 
 * NEVER throws - always returns a result object
 * Logs detailed error information for debugging
 * 
 * @param functionName - Name of the Edge Function
 * @param payload - Request payload
 * @returns Promise<InvokeEdgeResult>
 */
export async function invokeEdge<T = any>(
  functionName: string,
  payload: any
): Promise<InvokeEdgeResult<T>> {
  try {
    console.log(`[invokeEdge] Calling function: ${functionName}`);
    
    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
    });

    // Check for FunctionsHttpError or other errors
    if (error) {
      // Extract status code if available
      const status = (error as any).status || (error as any).statusCode || null;
      
      // Normalize error into consistent format
      const normalizedError: InvokeEdgeError = {
        name: error.name || 'FunctionsHttpError',
        message: error.message || 'Edge function invocation failed',
        status: status,
        details: JSON.stringify(error, null, 2),
      };

      // Log detailed error information
      console.log(`[invokeEdge] Function ${functionName} failed:`);
      console.log(`  - Name: ${normalizedError.name}`);
      console.log(`  - Message: ${normalizedError.message}`);
      console.log(`  - Status: ${normalizedError.status || 'unknown'}`);
      console.log(`  - Details: ${normalizedError.details.substring(0, 500)}`);

      // Try to extract response body if available
      if ((error as any).context?.body) {
        const bodyPreview = JSON.stringify((error as any).context.body).substring(0, 500);
        console.log(`  - Response body preview: ${bodyPreview}`);
      }

      return {
        data: null,
        error: normalizedError,
        status: status,
      };
    }

    // Success - return data
    console.log(`[invokeEdge] Function ${functionName} succeeded`);
    return {
      data: data as T,
      error: null,
      status: 200,
    };

  } catch (exception: any) {
    // Catch any unexpected errors (network issues, etc.)
    console.log(`[invokeEdge] Unexpected error invoking ${functionName}:`);
    console.log(`  - Type: ${exception?.constructor?.name || 'unknown'}`);
    console.log(`  - Message: ${exception?.message || 'unknown'}`);
    
    // Try to stringify the error for details
    let details = 'unknown';
    try {
      details = JSON.stringify(exception, Object.getOwnPropertyNames(exception), 2);
    } catch (e) {
      details = String(exception);
    }
    console.log(`  - Details: ${details.substring(0, 500)}`);

    // Return normalized error
    return {
      data: null,
      error: {
        name: 'Exception',
        message: exception?.message || 'Unexpected error during Edge Function invocation',
        status: null,
        details: details,
      },
      status: null,
    };
  }
}
