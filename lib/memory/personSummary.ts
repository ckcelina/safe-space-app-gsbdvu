
import { supabase } from '../supabase';

/**
 * Conversation continuity data structure
 */
export interface ContinuityData {
  summary: string;
  open_loops: string[];
  next_question: string;
}

/**
 * Fetch the conversation continuity data for a specific user and person.
 * Returns default empty values on error or if no data exists.
 */
export async function getPersonContinuity(
  userId: string,
  personId: string
): Promise<ContinuityData> {
  try {
    const { data, error } = await supabase
      .from('person_chat_summaries')
      .select('summary, open_loops, next_question')
      .eq('user_id', userId)
      .eq('person_id', personId)
      .single();

    if (error) {
      console.debug('[PersonSummary] Error fetching continuity:', error.message);
      return { summary: '', open_loops: [], next_question: '' };
    }

    // Safely parse and validate the data
    const summary = data?.summary || '';
    const open_loops = Array.isArray(data?.open_loops) ? data.open_loops : [];
    const next_question = data?.next_question || '';

    return { summary, open_loops, next_question };
  } catch (err) {
    console.debug('[PersonSummary] Exception in getPersonContinuity:', err);
    return { summary: '', open_loops: [], next_question: '' };
  }
}

/**
 * Fetch the chat summary for a specific user and person.
 * Returns empty string on error or if no summary exists.
 * 
 * @deprecated Use getPersonContinuity instead for full continuity data
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
      console.debug('[PersonSummary] Error fetching person summary:', error.message);
      return '';
    }

    return data?.summary || '';
  } catch (err) {
    console.debug('[PersonSummary] Exception in getPersonSummary:', err);
    return '';
  }
}

/**
 * Upsert conversation continuity data for a specific user and person.
 * Merges open_loops (deduplicates and keeps max 8).
 * Replaces summary and next_question with latest values.
 * Fails silently on error (no crash).
 */
export async function upsertPersonContinuity(
  userId: string,
  personId: string,
  continuityUpdate: {
    summary_update: string;
    open_loops: string[];
    next_question: string;
  }
): Promise<void> {
  try {
    // Fetch existing continuity to merge open_loops
    const existing = await getPersonContinuity(userId, personId);

    // Merge open_loops: combine existing + new, deduplicate, keep max 8
    const mergedLoops = Array.from(
      new Set([...existing.open_loops, ...continuityUpdate.open_loops])
    ).slice(0, 8);

    // Prepare upsert data
    const upsertData = {
      user_id: userId,
      person_id: personId,
      summary: continuityUpdate.summary_update || existing.summary,
      open_loops: mergedLoops,
      next_question: continuityUpdate.next_question || existing.next_question,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('person_chat_summaries')
      .upsert(upsertData, {
        onConflict: 'user_id,person_id',
      });

    if (error) {
      console.debug('[PersonSummary] Error upserting continuity:', error.message);
    } else {
      console.log('[PersonSummary] Continuity updated successfully');
    }
  } catch (err) {
    console.debug('[PersonSummary] Exception in upsertPersonContinuity:', err);
  }
}

/**
 * Insert or update a chat summary for a specific user and person.
 * Fails silently on error (no crash).
 * 
 * @deprecated Use upsertPersonContinuity instead for full continuity management
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
      console.debug('[PersonSummary] Error upserting person summary:', error.message);
    }
  } catch (err) {
    console.debug('[PersonSummary] Exception in upsertPersonSummary:', err);
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
