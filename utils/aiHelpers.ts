
import { supabase } from '@/lib/supabase';

interface AIReplyParams {
  user_id: string;
  person_id: string;
  person_name: string;
  relationship_type: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
}

/**
 * Generate AI reply by calling the Supabase Edge Function "generate-ai-response"
 * 
 * @param params - Object containing user_id, person_id, person_name, relationship_type, and messages
 * @returns A promise that resolves to the AI reply text, or fallback string if there's an error
 */
export const generateAIReply = async (params: AIReplyParams): Promise<string> => {
  const { user_id, person_id, person_name, relationship_type, messages } = params;
  
  console.log('Generating AI reply for person:', person_name);
  console.log('Recent messages count:', messages.length);
  
  try {
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('generate-ai-response', {
      body: {
        user_id,
        person_id,
        person_name,
        relationship_type,
        messages,
      },
    });

    if (error) {
      console.error('Error invoking Edge Function:', error);
      return "I'm having trouble replying right now, but your feelings matter.";
    }

    if (!data?.reply) {
      console.error('No reply received from Edge Function');
      return "I'm having trouble replying right now, but your feelings matter.";
    }

    console.log('AI reply received successfully');
    return data.reply;
  } catch (err: any) {
    console.error('Unexpected error generating AI reply:', err);
    return "I'm having trouble replying right now, but your feelings matter.";
  }
};
