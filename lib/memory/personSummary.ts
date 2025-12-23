
import { supabase } from '../supabase';

/**
 * Fetch the chat summary for a specific user and person.
 * Returns empty string on error or if no summary exists.
 */
export async function getPersonSummary(userId: string, personId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('person_chat_summaries')
      .select('summary')
      .eq('user_id', userId)
      .eq('person_id', personId)
      .single();

    if (error) {
      console.log('Error fetching person summary:', error.message);
      return '';
    }

    return data?.summary || '';
  } catch (err) {
    console.log('Exception in getPersonSummary:', err);
    return '';
  }
}

/**
 * Insert or update a chat summary for a specific user and person.
 * Fails silently on error (no crash).
 */
export async function upsertPersonSummary(
  userId: string,
  personId: string,
  summary: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('person_chat_summaries')
      .upsert(
        {
          user_id: userId,
          person_id: personId,
          summary: summary,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,person_id',
        }
      );

    if (error) {
      console.log('Error upserting person summary:', error.message);
    }
  } catch (err) {
    console.log('Exception in upsertPersonSummary:', err);
  }
}

/**
 * Helper function to build a prompt for summarizing chat history.
 * Can be used later when integrating with AI summary generation.
 */
export function buildSummaryPrompt(
  personName: string,
  currentSummary: string,
  newMessages: string
): string {
  if (!currentSummary) {
    return `You are creating a summary of the conversation history with ${personName}.

New messages to summarize:
${newMessages}

Create a concise summary that captures key themes, emotions, and important details.`;
  }

  return `You are updating a summary of the conversation history with ${personName}.

Current summary:
${currentSummary}

New messages to incorporate:
${newMessages}

Update the summary to incorporate the new information while maintaining key themes, emotions, and important details from the previous summary.`;
}
