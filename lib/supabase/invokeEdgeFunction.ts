
/**
 * invokeEdgeFunction.ts
 * 
 * Alternative Edge Function invocation utility using fetch directly.
 * This file is currently unused by the app (chat uses invokeEdgeSafe from invokeEdge.ts).
 * 
 * SECURITY: No hardcoded keys - relies on Supabase client configuration.
 * 
 * @deprecated Consider using invokeEdgeSafe from invokeEdge.ts instead
 */

import { supabase } from '../supabase';

/**
 * Invoke a Supabase Edge Function using fetch directly.
 * 
 * NOTE: This function is not currently used by the app.
 * The chat feature uses invokeEdgeSafe from invokeEdge.ts instead.
 * 
 * @param functionName - Name of the Edge Function to invoke
 * @param payload - Request body to send
 * @param accessToken - Optional user access token for authenticated requests
 * @returns Promise<any> - The response data from the Edge Function
 */
export async function invokeEdgeFunction(
  functionName: string,
  payload: any,
  accessToken?: string
): Promise<any> {
  try {
    // Get the Supabase project URL from the client
    const { data: { session } } = await supabase.auth.getSession();
    const projectUrl = supabase.supabaseUrl;
    
    // Construct the Edge Function URL
    const url = `${projectUrl}/functions/v1/${functionName}`;

    if (__DEV__) {
      console.log(`[invokeEdgeFunction] Calling ${functionName}`);
    }

    // Build headers - only include Authorization if we have an access token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header only if access token is provided
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (session?.access_token) {
      // Fallback to session token if available
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    // Note: We do NOT manually set the 'apikey' header.
    // The Supabase client handles authentication automatically.

    // Make the request
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    // Check if response is OK
    if (!response.ok) {
      const errorText = await response.text();
      
      if (__DEV__) {
        console.log(`[invokeEdgeFunction] Error response from ${functionName}:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
      }

      throw new Error(`Edge Function error: ${response.status} ${response.statusText}`);
    }

    // Parse and return the response
    const data = await response.json();

    if (__DEV__) {
      console.log(`[invokeEdgeFunction] Success from ${functionName}`);
    }

    return data;
  } catch (error: any) {
    if (__DEV__) {
      console.log(`[invokeEdgeFunction] Exception calling ${functionName}:`, {
        message: error?.message,
        stack: error?.stack,
      });
    }

    throw error;
  }
}
