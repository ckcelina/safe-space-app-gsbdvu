
/**
 * AI Client Helper for Safe Space App
 * 
 * This module provides a simplified function to call the Supabase Edge Function
 * for generating AI responses using the existing Supabase client.
 */

import { supabase } from '@/lib/supabase';

/**
 * Generate an AI reply by calling the Supabase Edge Function
 * 
 * @param personId - The ID of the person being discussed
 * @param messages - Array of recent conversation messages with role and content
 * @returns Promise that resolves to the AI-generated reply string or an error object
 */
export async function generateAIReply(
  personId: string,
  messages: { sender: 'user' | 'ai'; content: string; createdAt?: string }[]
): Promise<{ success: true; reply: string } | { success: false; error: string }> {
  const fallbackMessage = "I had trouble replying just now. Please check your connection and try again.";
  
  try {
    console.log('[AI Client] Generating AI reply for person:', personId);
    console.log('[AI Client] Message count:', messages.length);
    
    // Call the Supabase Edge Function using the existing Supabase client
    const { data, error } = await supabase.functions.invoke('generate-ai-response', {
      body: {
        personId,
        messages,
      },
    });
    
    // Check for errors
    if (error) {
      console.error('[AI Client] Supabase function error:', error);
      return { success: false, error: fallbackMessage };
    }
    
    // Validate that we received a reply
    if (!data || typeof data.reply !== 'string') {
      console.error('[AI Client] Missing or invalid reply in response:', data);
      return { success: false, error: fallbackMessage };
    }
    
    console.log('[AI Client] AI reply received successfully');
    return { success: true, reply: data.reply };
    
  } catch (error) {
    // Handle network errors, JSON parsing errors, or any other exceptions
    console.error('[AI Client] Network or unexpected error:', error);
    
    if (error instanceof Error) {
      console.error('[AI Client] Error message:', error.message);
      console.error('[AI Client] Error stack:', error.stack);
    }
    
    return { success: false, error: fallbackMessage };
  }
}
