
import { invokeEdgeFunction } from '../supabase/invokeEdgeFunction';
import { upsertPersonMemories, touchMemories, PersonMemoryInput } from './personMemory';

/**
 * Extract memories from recent chat messages and upsert them to the database.
 * This is the main entry point for memory extraction after chat messages.
 * 
 * ALWAYS returns a result (never throws)
 * Fails silently if extraction or upsert fails
 * 
 * @param params - Extraction parameters
 * @returns Object with continuity data (if available) and error (if any)
 */
export async function extractMemories(params: {
  personName: string;
  recentUserMessages: string[];
  lastAssistantMessage?: string;
  existingMemories: Array<{ key: string; value: string; category: string }>;
  userId: string;
  personId: string;
}): Promise<{
  continuity?: {
    summary_update: string;
    open_loops: string[];
    current_goal: string;
    last_advice: string;
    next_question: string;
  };
  error?: string;
}> {
  const { personName, recentUserMessages, lastAssistantMessage, existingMemories, userId, personId } = params;

  try {
    console.log('[Memory] Starting extraction for person:', personName);
    console.log('[Memory] User messages:', recentUserMessages.length);
    console.log('[Memory] Existing memories:', existingMemories.length);

    // Call the Edge Function using invokeEdgeFunction helper with proper auth headers
    const { data, error: invokeError } = await invokeEdgeFunction('extract-memories', {
      personName,
      recentUserMessages,
      lastAssistantMessage,
      existingMemories,
      userId,
      personId,
    });

    // Check for invocation error (network, HTTP error, etc.)
    if (invokeError) {
      console.log('[Memory Extraction] Edge Function error:', invokeError.message);
      console.log('[Memory Extraction] Returning empty result');
      return { 
        error: 'edge_function_invocation_error' 
      };
    }

    // Edge Function should ALWAYS return HTTP 200 with this structure
    const result = data as {
      success: boolean;
      memories: PersonMemoryInput[];
      mentioned_keys: string[];
      continuity?: {
        summary_update: string;
        open_loops: string[];
        current_goal: string;
        last_advice: string;
        next_question: string;
      };
      error: string | null;
    };

    // Check if Edge Function returned success: false
    if (!result?.success || result?.error) {
      console.log('[Memory] Edge Function returned error:', result?.error || 'unknown');
      console.log('[Memory] Returning empty result');
      return { 
        error: result?.error || 'extraction_failed' 
      };
    }

    console.log('[Memory] Extraction successful');
    console.log('[Memory] New memories:', result.memories?.length || 0);
    console.log('[Memory] Mentioned keys:', result.mentioned_keys?.length || 0);

    // STEP 1: Upsert new memories
    if (result.memories && result.memories.length > 0) {
      console.log('[Memory] Upserting', result.memories.length, 'memories...');
      await upsertPersonMemories(userId, personId, result.memories);
      console.log('[Memory] Upsert complete');
    } else {
      console.log('[Memory] No new memories to upsert');
    }

    // STEP 2: Touch mentioned memories (update last_mentioned_at)
    if (result.mentioned_keys && result.mentioned_keys.length > 0) {
      console.log('[Memory] Touching', result.mentioned_keys.length, 'mentioned keys...');
      await touchMemories(userId, personId, result.mentioned_keys);
      console.log('[Memory] Touch complete');
    }

    // STEP 3: Return continuity data for caller to handle
    return {
      continuity: result.continuity,
      error: null,
    };
  } catch (error: any) {
    console.log('[Memory] Unexpected error during extraction:', error?.message || error);
    return { 
      memories: [], 
      mentioned_keys: [],
      error: 'unexpected_error' 
    };
  }
}
