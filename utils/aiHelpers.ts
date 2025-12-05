
import { Message } from '@/types/database.types';

/**
 * Placeholder AI reply generator
 * 
 * This function currently returns a static reply from a predefined list.
 * In the future, this will be replaced with a call to a Supabase Edge Function
 * that uses OpenAI or another AI service to generate contextual responses.
 * 
 * @param personId - The ID of the person being discussed
 * @param recentMessages - Array of recent messages for context
 * @returns A promise that resolves to the AI reply text
 */
export const generateAIReply = async (
  personId: string,
  recentMessages: Message[]
): Promise<string> => {
  console.log('Generating AI reply for person:', personId);
  console.log('Recent messages count:', recentMessages.length);
  
  // Static placeholder replies
  const replies = [
    "I hear you, tell me more about how that feels.",
    "That sounds really challenging. How are you coping with this?",
    "Thank you for sharing that with me. What do you think would help?",
    "I understand. Can you tell me more about what happened?",
    "It's okay to feel that way. What's been on your mind lately?",
    "I'm here to listen. How does that make you feel?",
    "That must be difficult. What support do you need right now?",
    "I appreciate you opening up about this. What would you like to explore further?",
  ];
  
  // Simulate a small delay to make it feel more natural
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return a random reply
  return replies[Math.floor(Math.random() * replies.length)];
};

/**
 * Future implementation notes:
 * 
 * When ready to integrate with OpenAI via Supabase Edge Function:
 * 
 * 1. Call the Supabase Edge Function:
 *    const { data, error } = await supabase.functions.invoke('generate-ai-response', {
 *      body: {
 *        person_id: personId,
 *        recent_messages: recentMessages.slice(-10), // Last 10 messages for context
 *      }
 *    });
 * 
 * 2. Handle the response:
 *    if (error) {
 *      console.error('AI generation error:', error);
 *      return "I'm having trouble responding right now. Please try again.";
 *    }
 *    return data.reply;
 * 
 * 3. The Edge Function should:
 *    - Accept person_id and recent_messages
 *    - Build a context-aware prompt
 *    - Call OpenAI API
 *    - Return { reply: "..." }
 */
