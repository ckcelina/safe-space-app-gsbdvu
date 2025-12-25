
/**
 * invokeEdgeFunction - Resilient Supabase Edge Function invocation with proper auth headers
 * 
 * This helper wraps supabase.functions.invoke() with:
 * - Proper authentication headers (Authorization + apikey)
 * - Comprehensive error handling and logging
 * - Consistent return format
 * - Never throws - always returns a result
 * - DEV-only sanity check logging
 * 
 * @param fnName - Name of the Edge Function to invoke
 * @param body - Request payload to send
 * @returns Object with { data, error, status, raw }
 */

import { supabase } from '../supabase';
import { Platform } from 'react-native';

// Get the anon key from the supabase client initialization
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZreHZhaHJidXV5emp6eG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzQ0MjMsImV4cCI6MjA4MDQxMDQyM30.TrjFcA0HEbA6ocLLlbadS0RwuEjKU0ttnacGXyEk1M8';

export interface InvokeEdgeFunctionResult<T = any> {
  data: T | null;
  error: Error | null;
  status?: number;
  raw?: string;
}

/**
 * Invoke a Supabase Edge Function with proper auth headers and resilient error handling
 * 
 * NEVER throws - always returns a result object
 * Logs detailed error information for debugging
 * Includes auth headers (Authorization + apikey)
 * 
 * @param fnName - Name of the Edge Function
 * @param body - Request payload
 * @returns Promise<InvokeEdgeFunctionResult>
 */
export async function invokeEdgeFunction<T = any>(
  fnName: string,
  body: any
): Promise<InvokeEdgeFunctionResult<T>> {
  try {
    // STEP 1: Get current session access token
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    // DEV-ONLY: Sanity check log
    if (__DEV__) {
      console.log(`[invokeEdgeFunction] Calling ${fnName}`);
      console.log(`[invokeEdgeFunction] Access token present: ${!!accessToken}`);
    }

    // STEP 2: Build headers with auth
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    };

    // Add Authorization header if we have an access token
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // STEP 3: Call the Edge Function with headers
    console.log(`[invokeEdgeFunction] Invoking function: ${fnName}`);
    const { data, error } = await supabase.functions.invoke(fnName, {
      body,
      headers,
    });

    // STEP 4: Check for errors
    if (error) {
      // Extract status code if available
      const status = (error as any).status || (error as any).statusCode || null;
      
      // Log detailed error information
      console.log(`[invokeEdgeFunction] ${fnName} failed:`);
      console.log(`  - Function name: ${fnName}`);
      console.log(`  - Status: ${status || 'unknown'}`);
      console.log(`  - Error name: ${error.name || 'unknown'}`);
      console.log(`  - Error message: ${error.message || 'unknown'}`);
      
      // Try to extract and log response body
      let rawResponse = 'not available';
      try {
        if ((error as any).context?.body) {
          rawResponse = JSON.stringify((error as any).context.body);
        } else if ((error as any).body) {
          rawResponse = JSON.stringify((error as any).body);
        } else {
          rawResponse = JSON.stringify(error, Object.getOwnPropertyNames(error));
        }
        console.log(`  - Raw response: ${rawResponse.substring(0, 500)}`);
      } catch (e) {
        console.log(`  - Could not stringify error response`);
      }

      return {
        data: null,
        error,
        status: status,
        raw: rawResponse,
      };
    }

    // STEP 5: Success - return data
    console.log(`[invokeEdgeFunction] ${fnName} succeeded`);
    return {
      data: data as T,
      error: null,
      status: 200,
    };

  } catch (exception: any) {
    // Catch any unexpected errors (network issues, etc.)
    console.log(`[invokeEdgeFunction] Unexpected error invoking ${fnName}:`);
    console.log(`  - Function name: ${fnName}`);
    console.log(`  - Exception type: ${exception?.constructor?.name || 'unknown'}`);
    console.log(`  - Exception message: ${exception?.message || 'unknown'}`);
    
    // Try to stringify the error for details
    let details = 'unknown';
    try {
      details = JSON.stringify(exception, Object.getOwnPropertyNames(exception), 2);
      console.log(`  - Exception details: ${details.substring(0, 500)}`);
    } catch (e) {
      details = String(exception);
      console.log(`  - Exception string: ${details.substring(0, 500)}`);
    }

    // Return normalized error
    return {
      data: null,
      error: exception instanceof Error ? exception : new Error(String(exception)),
      status: (exception as any)?.status || null,
      raw: details,
    };
  }
}
