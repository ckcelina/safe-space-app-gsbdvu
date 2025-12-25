
import { supabase } from '../supabase';
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

    // Call the Edge Function
    const { data, error: fnError } = await supabase.functions.invoke('extract-memories', {
      body: {
        personName,
        recentUserMessages,
        lastAssistantMessage,
        existingMemories,
        userId,
        personId,
      },
    });

    if (fnError) {
      console.log('[Memory] Edge Function invocation error:', fnError.message);
      // Try local fallback
      await localFallbackExtraction(recentUserMessages, userId, personId);
      return { error: 'edge_function_error' };
    }

    // Edge Function should ALWAYS return HTTP 200 with this structure
    const result = data as {
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

    if (result.error) {
      console.log('[Memory] Edge Function returned error:', result.error);
      // Try local fallback
      await localFallbackExtraction(recentUserMessages, userId, personId);
      return { error: result.error };
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
    // Try local fallback
    await localFallbackExtraction(recentUserMessages, userId, personId);
    return { error: 'unexpected_error' };
  }
}

/**
 * Local fallback for memory extraction when Edge Function fails.
 * Uses simple heuristics to extract basic facts.
 * NEVER throws - fails silently.
 */
async function localFallbackExtraction(
  recentUserMessages: string[],
  userId: string,
  personId: string
): Promise<void> {
  try {
    console.log('[Memory] Running local fallback extraction...');

    const memories: PersonMemoryInput[] = [];

    // Combine recent messages into one text
    const text = recentUserMessages.join(' ').toLowerCase();

    // HEURISTIC 1: Deceased detection
    if (
      text.includes('passed away') ||
      text.includes('died') ||
      text.includes('deceased') ||
      text.includes('is dead') ||
      text.includes('has died')
    ) {
      console.log('[Memory] Fallback: Detected deceased');
      memories.push({
        category: 'loss_grief',
        key: 'is_deceased',
        value: 'true',
        importance: 5,
        confidence: 5,
      });
    }

    // HEURISTIC 2: Relationship type detection
    const relationshipPatterns = [
      { pattern: /my mom|my mother/i, type: 'Mother' },
      { pattern: /my dad|my father/i, type: 'Father' },
      { pattern: /my boyfriend/i, type: 'Boyfriend' },
      { pattern: /my girlfriend/i, type: 'Girlfriend' },
      { pattern: /my husband/i, type: 'Husband' },
      { pattern: /my wife/i, type: 'Wife' },
      { pattern: /my friend/i, type: 'Friend' },
      { pattern: /my brother/i, type: 'Brother' },
      { pattern: /my sister/i, type: 'Sister' },
    ];

    for (const { pattern, type } of relationshipPatterns) {
      if (pattern.test(text)) {
        console.log('[Memory] Fallback: Detected relationship type:', type);
        memories.push({
          category: 'relationship',
          key: 'relationship_type',
          value: type,
          importance: 4,
          confidence: 4,
        });
        break; // Only detect one relationship type
      }
    }

    // Upsert fallback memories if any were detected
    if (memories.length > 0) {
      console.log('[Memory] Fallback: Upserting', memories.length, 'memories...');
      await upsertPersonMemories(userId, personId, memories);
      console.log('[Memory] Fallback: Upsert complete');
    } else {
      console.log('[Memory] Fallback: No memories detected');
    }
  } catch (error) {
    console.log('[Memory] Fallback extraction failed (silent):', error);
    // Fail silently - never crash
  }
}
