
/**
 * Memory Extraction Module for Safe Space App
 * 
 * This module extracts stable facts from user messages and stores them
 * in the person_memories table to build a per-person "brain" over time.
 * 
 * ALSO extracts conversation continuity data to enable natural conversation flow.
 * 
 * FAIL-SAFE: All errors are caught silently to avoid disrupting chat flow.
 * NO ERRORS ARE LOGGED TO CONSOLE.ERROR - extraction failures are completely silent.
 */

import { supabase } from '../supabase';
import { upsertPersonMemories, touchMemories } from './personMemory';

export interface ExtractMemoriesParams {
  personName: string;
  recentUserMessages: string[];
  lastAssistantMessage?: string;
  existingMemories: any[];
  userId: string;
  personId: string;
}

export interface ContinuityData {
  summary_update: string;
  open_loops: string[];
  current_goal: string;
  last_advice: string;
  next_question: string;
}

export interface ExtractMemoriesResult {
  memories: any[];
  mentioned_keys: string[];
  continuity?: ContinuityData;
}

/**
 * Safe default result for when extraction fails
 */
const SAFE_DEFAULT_RESULT: ExtractMemoriesResult = {
  memories: [],
  mentioned_keys: [],
  continuity: {
    summary_update: "",
    open_loops: [],
    current_goal: "",
    last_advice: "",
    next_question: ""
  }
};

/**
 * Extract memories and conversation continuity from recent conversation using Supabase Edge Function
 * 
 * This function:
 * 1. Calls a Supabase Edge Function that uses OpenAI to extract stable facts
 * 2. Also extracts conversation continuity data (summary, open loops, current goal, last advice, next question)
 * 3. Parses the JSON response
 * 4. Upserts new memories to the database
 * 5. Updates last_mentioned_at for mentioned keys
 * 
 * FAIL-SAFE: If extraction fails at any point, returns empty result
 * and continues normal chat flow without disruption.
 * 
 * SILENT FAILURES: All errors are caught and logged with console.debug only.
 * No console.error calls to prevent red LogBox errors.
 */
export async function extractMemories({
  personName,
  recentUserMessages,
  lastAssistantMessage,
  existingMemories,
  userId,
  personId,
}: ExtractMemoriesParams): Promise<ExtractMemoriesResult> {
  try {
    console.log('[Memory Extraction] Starting extraction for person:', personName);
    console.log('[Memory Extraction] User messages:', recentUserMessages.length);
    console.log('[Memory Extraction] Existing memories:', existingMemories.length);

    // Call the Supabase Edge Function for memory extraction + continuity
    // Wrapped in try/catch to handle any network or invocation errors
    let data: any;
    let error: any;
    
    try {
      const response = await supabase.functions.invoke('extract-memories', {
        body: {
          personName,
          recentUserMessages,
          lastAssistantMessage,
          existingMemories: existingMemories.map(m => ({
            key: m.key,
            value: m.value,
            category: m.category,
          })),
        },
      });
      
      data = response.data;
      error = response.error;
    } catch (invokeError) {
      // Network error or invocation failure - fail silently
      console.debug('[Memory Extraction] Invoke failed silently:', invokeError);
      return { ...SAFE_DEFAULT_RESULT };
    }

    // Check for Edge Function errors
    if (error) {
      console.debug('[Memory Extraction] Edge Function returned error (silent):', error);
      return { ...SAFE_DEFAULT_RESULT };
    }

    // Check if data exists
    if (!data) {
      console.debug('[Memory Extraction] No data returned from Edge Function (silent)');
      return { ...SAFE_DEFAULT_RESULT };
    }

    // Defensive validation: ensure response has expected shape
    if (typeof data !== 'object') {
      console.debug('[Memory Extraction] Invalid response type (silent)');
      return { ...SAFE_DEFAULT_RESULT };
    }

    // Safely extract and validate each field
    const memories = Array.isArray(data.memories) ? data.memories : [];
    const mentioned_keys = Array.isArray(data.mentioned_keys) ? data.mentioned_keys : [];
    
    // Validate continuity object
    let continuity = SAFE_DEFAULT_RESULT.continuity;
    if (data.continuity && typeof data.continuity === 'object') {
      continuity = {
        summary_update: typeof data.continuity.summary_update === 'string' ? data.continuity.summary_update : "",
        open_loops: Array.isArray(data.continuity.open_loops) ? data.continuity.open_loops : [],
        current_goal: typeof data.continuity.current_goal === 'string' ? data.continuity.current_goal : "",
        last_advice: typeof data.continuity.last_advice === 'string' ? data.continuity.last_advice : "",
        next_question: typeof data.continuity.next_question === 'string' ? data.continuity.next_question : ""
      };
    }

    const result: ExtractMemoriesResult = {
      memories,
      mentioned_keys,
      continuity,
    };

    console.log('[Memory Extraction] Parsed result:', {
      memoriesCount: result.memories.length,
      mentionedKeysCount: result.mentioned_keys.length,
      hasContinuity: !!result.continuity,
      continuityFields: result.continuity ? {
        hasSummary: !!result.continuity.summary_update,
        openLoopsCount: result.continuity.open_loops.length,
        hasGoal: !!result.continuity.current_goal,
        hasAdvice: !!result.continuity.last_advice,
        hasNextQuestion: !!result.continuity.next_question,
      } : null,
    });

    // Special case: Check if user explicitly mentioned the person is deceased
    try {
      const conversationText = recentUserMessages.join(' ').toLowerCase();
      const deathKeywords = ['passed away', 'died', 'deceased', 'is dead', 'has died'];
      const hasDeathMention = deathKeywords.some(keyword => conversationText.includes(keyword));

      if (hasDeathMention) {
        // Check if we already have the is_deceased memory
        const hasDeceasedMemory = result.memories.some(m => m.key === 'is_deceased');
        
        if (!hasDeceasedMemory) {
          console.log('[Memory Extraction] Death mention detected, adding is_deceased memory');
          result.memories.push({
            category: 'loss_grief',
            key: 'is_deceased',
            value: 'true',
            importance: 5,
            confidence: 5,
          });
        }
      }
    } catch (deathCheckError) {
      // Fail silently if death check fails
      console.debug('[Memory Extraction] Death check failed silently:', deathCheckError);
    }

    // Upsert new memories to the database
    if (result.memories.length > 0) {
      try {
        console.log('[Memory Extraction] Upserting', result.memories.length, 'memories');
        await upsertPersonMemories(userId, personId, result.memories);
      } catch (upsertError) {
        // Fail silently if upsert fails
        console.debug('[Memory Extraction] Upsert failed silently:', upsertError);
      }
    }

    // Update last_mentioned_at for mentioned keys
    if (result.mentioned_keys.length > 0) {
      try {
        console.log('[Memory Extraction] Touching', result.mentioned_keys.length, 'memory keys');
        await touchMemories(userId, personId, result.mentioned_keys);
      } catch (touchError) {
        // Fail silently if touch fails
        console.debug('[Memory Extraction] Touch failed silently:', touchError);
      }
    }

    console.log('[Memory Extraction] Extraction complete');
    return result;

  } catch (error: any) {
    // Top-level catch: fail completely silently
    console.debug('[Memory Extraction] Unexpected error (silent):', error?.message || error);
    // Return safe defaults - don't disrupt chat flow
    return { ...SAFE_DEFAULT_RESULT };
  }
}

/**
 * Helper function to extract memories in the background
 * This is a fire-and-forget wrapper that ensures extraction never blocks the UI
 */
export function extractMemoriesAsync(params: ExtractMemoriesParams): void {
  // Fire and forget - don't await
  extractMemories(params).catch(error => {
    // Silently fail - use debug logging only
    console.debug('[Memory Extraction] Background extraction failed (silent):', error);
    // This is intentional - extraction is optional
  });
}
