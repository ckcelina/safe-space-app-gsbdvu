
import { Message } from '@/types/database.types';
import { supabase } from '@/lib/supabase';

/**
 * Generate AI reply by calling the Supabase Edge Function
 * 
 * This function calls the "generate-ai-response" Edge Function with the person ID
 * and recent messages for context. The Edge Function handles the OpenAI API call
 * and returns a contextual AI response.
 * 
 * @param personId - The ID of the person being discussed
 * @param recentMessages - Array of recent messages for context (last 20-30 messages)
 * @returns A promise that resolves to the AI reply text, or null if there's an error
 */
export const generateAIReply = async (
  personId: string,
  recentMessages: Message[]
): Promise<string | null> => {
  console.log('Generating AI reply for person:', personId);
  console.log('Recent messages count:', recentMessages.length);
  
  try {
    // Get the last 30 messages for context
    const contextMessages = recentMessages.slice(-30);
    
    console.log('Calling generate-ai-response Edge Function...');
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('generate-ai-response', {
      body: {
        personId,
        messages: contextMessages,
      },
    });

    if (error) {
      console.error('Error invoking Edge Function:', error);
      return null;
    }

    if (!data?.reply) {
      console.error('No reply received from Edge Function');
      return null;
    }

    console.log('AI reply received successfully');
    return data.reply;
  } catch (err) {
    console.error('Unexpected error generating AI reply:', err);
    return null;
  }
};
