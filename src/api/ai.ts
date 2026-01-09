
/**
 * AI API Helper for Safe Space App
 * 
 * This module provides functions to interact with the Supabase Edge Function
 * for generating AI responses in conversations.
 */

// Import Supabase URL and Anon Key from existing configuration
const SUPABASE_URL = 'https://zjzvkxvahrbuuyzjzxol.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZreHZhaHJidXV5emp6eG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzQ0MjMsImV4cCI6MjA4MDQxMDQyM30.TrjFcA0HEbA6ocLLlbadS0RwuEjKU0ttnacGXyEk1M8';

/**
 * Generate an AI reply by calling the Supabase Edge Function
 * 
 * @param params - Configuration object for the AI reply generation
 * @param params.userId - The ID of the current user
 * @param params.personId - The ID of the person being discussed
 * @param params.personName - The name of the person being discussed
 * @param params.relationshipType - Optional relationship type (e.g., "friend", "family")
 * @param params.messages - Array of recent conversation messages
 * @returns Promise that resolves to the AI-generated reply string
 */
export async function generateAIReply(params: {
  userId: string;
  personId: string;
  personName: string;
  relationshipType?: string | null;
  messages: { role: 'user' | 'assistant'; content: string }[];
}): Promise<string> {
  const fallbackMessage = "I'm having trouble replying right now, but your feelings matter. Please try again in a moment.";
  
  try {
    console.log('[AI API] Generating AI reply for person:', params.personName);
    console.log('[AI API] Message count:', params.messages.length);
    
    // Construct the Edge Function URL
    const url = `${SUPABASE_URL}/functions/v1/generate-ai-response`;
    
    // Make the POST request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        user_id: params.userId,
        person_id: params.personId,
        person_name: params.personName,
        relationship_type: params.relationshipType ?? null,
        messages: params.messages,
      }),
    });
    
    // Check if the response is OK (status 200-299)
    if (!response.ok) {
      console.error('[AI API] HTTP error! Status:', response.status);
      console.error('[AI API] Status text:', response.statusText);
      
      // Try to get error details from response body
      try {
        const errorData = await response.json();
        console.error('[AI API] Error details:', errorData);
      } catch (parseError) {
        console.error('[AI API] Could not parse error response');
      }
      
      return fallbackMessage;
    }
    
    // Parse the JSON response
    const data = await response.json();
    
    // Validate that we received a reply
    if (!data || typeof data.reply !== 'string') {
      console.error('[AI API] Missing or invalid reply in response:', data);
      return fallbackMessage;
    }
    
    console.log('[AI API] AI reply received successfully');
    return data.reply;
    
  } catch (error) {
    // Handle network errors, JSON parsing errors, or any other exceptions
    console.error('[AI API] Network or unexpected error:', error);
    
    if (error instanceof Error) {
      console.error('[AI API] Error message:', error.message);
      console.error('[AI API] Error stack:', error.stack);
    }
    
    return fallbackMessage;
  }
}
