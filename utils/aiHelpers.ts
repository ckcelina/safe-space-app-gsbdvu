
import { Message } from '@/types/database.types';
import { supabase } from '@/lib/supabase';
import { showErrorToast } from './toast';

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
    
    // Transform messages to match Edge Function expected format
    // Edge Function expects 'sender' field with 'user' or 'ai'
    // Database has 'role' field with 'user' or 'assistant'
    const formattedMessages = contextMessages.map((m) => ({
      sender: m.role === 'assistant' ? 'ai' : m.role,
      content: m.content,
      createdAt: m.created_at,
    }));
    
    console.log('Calling generate-ai-response Edge Function...');
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('generate-ai-response', {
      body: {
        personId,
        messages: formattedMessages,
      },
    });

    if (error) {
      console.error('Error invoking Edge Function:', error);
      showErrorToast('Failed to generate AI response. Please try again.');
      return null;
    }

    if (!data?.reply) {
      console.error('No reply received from Edge Function');
      showErrorToast('AI response was empty. Please try again.');
      return null;
    }

    console.log('AI reply received successfully');
    return data.reply;
  } catch (err: any) {
    console.error('Unexpected error generating AI reply:', err);
    showErrorToast(`AI Error: ${err.message || 'Unknown error'}`);
    return null;
  }
};
