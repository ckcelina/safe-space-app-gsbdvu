
import { invokeEdge } from '../supabase/invokeEdge';
import { upsertPersonMemories, touchMemories, PersonMemoryInput } from './personMemory';
import { extractMemoriesFromUserText } from './localExtract';

/**
 * Extract memories from recent chat messages and upsert them to the database.
 * This is the main entry point for memory extraction after chat messages.
 * 
 * ALWAYS returns a result (never throws)
 * Fails silently if extraction or upsert fails
 * Uses local fallback extraction if Edge Function fails
 * 
 * @param params - Extraction parameters
 * @returns Object with continuity data (if available) and error (if any)
 */
export async function extractMemories(params: {
  personName: string;
  recentUserMessages: string[];
  lastAssistantMessage?: string;
  existingMemories: { key: string; value: string; category: string }[];
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

    // Call the Edge Function using invokeEdge helper with detailed error logging
    const { data, error: invokeError } = await invokeEdge('extract-memories', {
      personName,
      recentUserMessages,
      lastAssistantMessage,
      existingMemories,
      userId,
      personId,
    });

    // Check for invocation error (network, HTTP error, etc.)
    if (invokeError) {
      console.error('[Memory Extraction] Edge Function invocation error:', invokeError.message);
      console.error('[Memory Extraction] Error details:', {
        name: invokeError.name,
        status: invokeError.status,
        responseBody: invokeError.responseBody?.substring(0, 200),
      });
      console.log('[Memory Extraction] Falling back to local extraction...');
      
      // LOCAL FALLBACK: Use local extraction when Edge Function fails
      const localMemories: PersonMemoryInput[] = [];
      
      // Extract from each user message
      for (const message of recentUserMessages) {
        const extracted = extractMemoriesFromUserText(message, personName);
        localMemories.push(...extracted);
      }
      
      if (localMemories.length > 0) {
        console.log('[Memory Extraction] Local extraction found', localMemories.length, 'memories');
        await upsertPersonMemories(userId, personId, localMemories);
        console.log('[Memory Extraction] Local memories upserted');
      } else {
        console.log('[Memory Extraction] Local extraction found no memories');
      }
      
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
      console.error('[Memory] Edge Function returned error:', result?.error || 'unknown');
      console.log('[Memory] Falling back to local extraction...');
      
      // LOCAL FALLBACK: Use local extraction when Edge Function returns error
      const localMemories: PersonMemoryInput[] = [];
      
      // Extract from each user message
      for (const message of recentUserMessages) {
        const extracted = extractMemoriesFromUserText(message, personName);
        localMemories.push(...extracted);
      }
      
      if (localMemories.length > 0) {
        console.log('[Memory Extraction] Local extraction found', localMemories.length, 'memories');
        await upsertPersonMemories(userId, personId, localMemories);
        console.log('[Memory Extraction] Local memories upserted');
      } else {
        console.log('[Memory Extraction] Local extraction found no memories');
      }
      
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
    console.error('[Memory] Unexpected error during extraction:', error?.message || error);
    
    // LOCAL FALLBACK: Use local extraction on unexpected error
    try {
      console.log('[Memory] Attempting local extraction fallback...');
      const localMemories: PersonMemoryInput[] = [];
      
      // Extract from each user message
      for (const message of recentUserMessages) {
        const extracted = extractMemoriesFromUserText(message, personName);
        localMemories.push(...extracted);
      }
      
      if (localMemories.length > 0) {
        console.log('[Memory Extraction] Local extraction found', localMemories.length, 'memories');
        await upsertPersonMemories(userId, personId, localMemories);
        console.log('[Memory Extraction] Local memories upserted');
      } else {
        console.log('[Memory Extraction] Local extraction found no memories');
      }
    } catch (fallbackError) {
      console.error('[Memory] Local fallback also failed:', fallbackError);
    }
    
    return { 
      error: 'unexpected_error' 
    };
  }
}
