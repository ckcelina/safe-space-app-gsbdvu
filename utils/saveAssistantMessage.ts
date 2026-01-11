
import { supabase } from '@/lib/supabase';

interface SaveMessageParams {
  personId: string;
  content: string;
  userId: string;
  subject?: string;
}

interface SaveMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Safely save an assistant message to the database with robust error handling
 * 
 * IMPORTANT: This utility is typically NOT needed because the Edge Function
 * (generate-ai-response) already saves assistant messages to the database.
 * 
 * Use this only for special cases like:
 * - Saving messages without calling the Edge Function
 * - Retry logic for failed saves
 * - Testing/debugging scenarios
 */
export async function saveAssistantMessage({
  personId,
  content,
  userId,
  subject,
}: SaveMessageParams): Promise<SaveMessageResult> {
  try {
    // Ensure we have a valid timestamp
    const createdAt = new Date().toISOString();

    // Prepare the payload with all required fields matching the database schema
    const payload = {
      user_id: userId,
      person_id: personId,
      role: 'assistant' as const, // Must be 'user' or 'assistant' per schema
      content: content.trim(),
      subject: subject || null,
      created_at: createdAt,
    };

    console.log('[SaveAssistantMessage] Attempting to save:', {
      user_id: payload.user_id,
      person_id: payload.person_id,
      role: payload.role,
      content_length: payload.content.length,
      subject: payload.subject,
    });

    // Insert with authenticated session
    const { data, error } = await supabase
      .from('messages')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      console.error('[SaveAssistantMessage] Database error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        payload: {
          user_id: payload.user_id,
          person_id: payload.person_id,
          role: payload.role,
          subject: payload.subject,
          created_at: payload.created_at,
        },
      });

      return {
        success: false,
        error: error.message || 'Failed to save assistant message',
      };
    }

    console.log('[SaveAssistantMessage] Successfully saved message:', data?.id);

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error: any) {
    console.error('[SaveAssistantMessage] Unexpected error:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
    });

    return {
      success: false,
      error: error?.message || 'Unexpected error saving message',
    };
  }
}

/**
 * Save assistant message with retry logic for transient failures
 * 
 * Features:
 * - Retries up to maxRetries times with exponential backoff
 * - Skips retry for RLS/permission errors (not transient)
 * - Returns detailed error information for debugging
 */
export async function saveAssistantMessageWithRetry(
  params: SaveMessageParams,
  maxRetries: number = 2
): Promise<SaveMessageResult> {
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      console.log(`[SaveAssistantMessage] Retry attempt ${attempt}/${maxRetries}`);
      // Wait before retrying (exponential backoff: 1s, 2s, 4s)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }

    const result = await saveAssistantMessage(params);

    if (result.success) {
      if (attempt > 0) {
        console.log(`[SaveAssistantMessage] ✅ Succeeded on retry attempt ${attempt}`);
      }
      return result;
    }

    lastError = result.error;

    // Don't retry on RLS or permission errors (these won't be fixed by retrying)
    if (result.error?.includes('policy') || result.error?.includes('permission')) {
      console.log('[SaveAssistantMessage] RLS/permission error detected - skipping retry');
      break;
    }
  }

  return {
    success: false,
    error: lastError || 'Failed after retries',
  };
}
