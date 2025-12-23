
/**
 * Memory Extraction Module for Safe Space App
 * 
 * This module extracts stable facts from user messages and stores them
 * in the person_memories table to build a per-person "brain" over time.
 * 
 * FAIL-SAFE: All errors are caught silently to avoid disrupting chat flow.
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

export interface ExtractMemoriesResult {
  memories: any[];
  mentioned_keys: string[];
}

/**
 * Extract memories from recent conversation using Supabase Edge Function
 * 
 * This function:
 * 1. Calls a Supabase Edge Function that uses OpenAI to extract stable facts
 * 2. Parses the JSON response
 * 3. Upserts new memories to the database
 * 4. Updates last_mentioned_at for mentioned keys
 * 
 * FAIL-SAFE: If extraction fails at any point, returns empty result
 * and continues normal chat flow without disruption.
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

    // Call the Supabase Edge Function for memory extraction
    const { data, error } = await supabase.functions.invoke('extract-memories', {
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

    if (error) {
      console.error('[Memory Extraction] Edge Function error:', error);
      return { memories: [], mentioned_keys: [] };
    }

    if (!data) {
      console.log('[Memory Extraction] No data returned from Edge Function');
      return { memories: [], mentioned_keys: [] };
    }

    const result: ExtractMemoriesResult = {
      memories: data.memories || [],
      mentioned_keys: data.mentioned_keys || [],
    };

    console.log('[Memory Extraction] Parsed result:', {
      memoriesCount: result.memories.length,
      mentionedKeysCount: result.mentioned_keys.length,
    });

    // Special case: Check if user explicitly mentioned the person is deceased
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

    // Upsert new memories to the database
    if (result.memories.length > 0) {
      console.log('[Memory Extraction] Upserting', result.memories.length, 'memories');
      await upsertPersonMemories(userId, personId, result.memories);
    }

    // Update last_mentioned_at for mentioned keys
    if (result.mentioned_keys.length > 0) {
      console.log('[Memory Extraction] Touching', result.mentioned_keys.length, 'memory keys');
      await touchMemories(userId, personId, result.mentioned_keys);
    }

    console.log('[Memory Extraction] Extraction complete');
    return result;

  } catch (error: any) {
    console.error('[Memory Extraction] Unexpected error:', error?.message || error);
    // Fail silently - don't disrupt chat flow
    return { memories: [], mentioned_keys: [] };
  }
}

/**
 * Helper function to extract memories in the background
 * This is a fire-and-forget wrapper that ensures extraction never blocks the UI
 */
export function extractMemoriesAsync(params: ExtractMemoriesParams): void {
  // Fire and forget - don't await
  extractMemories(params).catch(error => {
    console.error('[Memory Extraction] Background extraction failed:', error);
    // Silently fail - this is intentional
  });
}
