
/**
 * invokeEdge - Resilient Supabase Edge Function invocation helper
 * 
 * This helper wraps supabase.functions.invoke() with:
 * - Comprehensive error handling and normalization
 * - Detailed logging for debugging (including response body)
 * - Consistent return format
 * - Never throws - always returns a result
 * 
 * @param functionName - Name of the Edge Function to invoke
 * @param payload - Request payload to send
 * @returns Object with { data, error, status, debug }
 */

import { supabase } from '../supabase';
import * as Clipboard from 'expo-clipboard';

export interface InvokeEdgeError {
  name: string;
  message: string;
  status: number | null;
  details: string;
  responseBody?: string;
}

export interface InvokeEdgeResult<T = any> {
  data: T | null;
  error: InvokeEdgeError | null;
  status: number | null;
  debug?: {
    functionName: string;
    timestamp: string;
    errorDetails: any;
  };
}

/**
 * Invoke a Supabase Edge Function with resilient error handling
 * 
 * NEVER throws - always returns a result object
 * Logs detailed error information for debugging
 * Captures response body for non-2xx responses
 * 
 * @param functionName - Name of the Edge Function
 * @param payload - Request payload
 * @returns Promise<InvokeEdgeResult>
 */
export async function invokeEdge<T = any>(
  functionName: string,
  payload: any
): Promise<InvokeEdgeResult<T>> {
  const timestamp = new Date().toISOString();
  
  try {
    console.log(`[invokeEdge] Calling function: ${functionName}`);
    console.log(`[invokeEdge] Timestamp: ${timestamp}`);
    
    // Get current session for auth
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.warn('[invokeEdge] No access token available - function may fail if auth is required');
    }
    
    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
    });

    // Check for FunctionsHttpError or other errors
    if (error) {
      // Extract status code if available
      const status = (error as any).status || (error as any).statusCode || null;
      
      // Try to extract response body
      let responseBody = 'not available';
      try {
        if ((error as any).context?.body) {
          responseBody = JSON.stringify((error as any).context.body);
        } else if ((error as any).body) {
          responseBody = JSON.stringify((error as any).body);
        } else if ((error as any).message) {
          responseBody = (error as any).message;
        }
      } catch (e) {
        console.log('[invokeEdge] Could not extract response body');
      }
      
      // Normalize error into consistent format
      const normalizedError: InvokeEdgeError = {
        name: error.name || 'FunctionsHttpError',
        message: error.message || 'Edge function invocation failed',
        status: status,
        details: JSON.stringify(error, null, 2),
        responseBody: responseBody,
      };

      // Log detailed error information
      console.error(`[invokeEdge] ❌ Function ${functionName} failed:`);
      console.error(`  - Function name: ${functionName}`);
      console.error(`  - Timestamp: ${timestamp}`);
      console.error(`  - Error name: ${normalizedError.name}`);
      console.error(`  - Error message: ${normalizedError.message}`);
      console.error(`  - Status: ${normalizedError.status || 'unknown'}`);
      console.error(`  - Response body: ${responseBody.substring(0, 500)}`);
      console.error(`  - Full error details: ${normalizedError.details.substring(0, 500)}`);

      // Create debug object for dev mode
      const debug = {
        functionName,
        timestamp,
        errorDetails: {
          name: normalizedError.name,
          message: normalizedError.message,
          status: normalizedError.status,
          responseBody: responseBody.substring(0, 500),
          fullError: normalizedError.details.substring(0, 500),
        },
      };

      return {
        data: null,
        error: normalizedError,
        status: status,
        debug,
      };
    }

    // Success - return data
    console.log(`[invokeEdge] ✅ Function ${functionName} succeeded`);
    return {
      data: data as T,
      error: null,
      status: 200,
    };

  } catch (exception: any) {
    // Catch any unexpected errors (network issues, etc.)
    console.error(`[invokeEdge] ❌ Unexpected error invoking ${functionName}:`);
    console.error(`  - Function name: ${functionName}`);
    console.error(`  - Timestamp: ${timestamp}`);
    console.error(`  - Exception type: ${exception?.constructor?.name || 'unknown'}`);
    console.error(`  - Exception message: ${exception?.message || 'unknown'}`);
    
    // Try to stringify the error for details
    let details = 'unknown';
    try {
      details = JSON.stringify(exception, Object.getOwnPropertyNames(exception), 2);
      console.error(`  - Exception details: ${details.substring(0, 500)}`);
    } catch (e) {
      details = String(exception);
      console.error(`  - Exception string: ${details.substring(0, 500)}`);
    }

    // Create debug object for dev mode
    const debug = {
      functionName,
      timestamp,
      errorDetails: {
        type: exception?.constructor?.name || 'unknown',
        message: exception?.message || 'unknown',
        details: details.substring(0, 500),
      },
    };

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
      debug,
    };
  }
}

/**
 * Copy debug information to clipboard (for dev mode)
 */
export async function copyDebugToClipboard(debug: any): Promise<void> {
  try {
    const debugString = JSON.stringify(debug, null, 2);
    await Clipboard.setStringAsync(debugString);
    console.log('[invokeEdge] Debug info copied to clipboard');
  } catch (error) {
    console.error('[invokeEdge] Failed to copy debug info:', error);
  }
}
