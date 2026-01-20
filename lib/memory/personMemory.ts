
import { supabase } from '../supabase';

/**
 * PersonMemory type matching the person_memories table structure
 */
export interface PersonMemory {
  id: string;
  user_id: string;
  person_id: string;
  category: string;
  key: string;
  value: string;
  importance: number;
  confidence: number;
  last_mentioned_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Memory input type for upsert operations
 */
export type PersonMemoryInput = {
  category: string;
  key: string;
  value: string;
  importance: number;
  confidence: number;
};

/**
 * Fetch memories for a specific person/topic
 * 
 * @param userId - The authenticated user's ID
 * @param personId - The person/topic ID
 * @param limit - Maximum number of memories to fetch (default: 25)
 * @returns Array of PersonMemory objects, or empty array on error
 */
export async function getPersonMemories(
  userId: string,
  personId: string,
  limit: number = 25
): Promise<PersonMemory[]> {
  try {
    console.log('[Memory] Fetching memories for user:', userId, 'person:', personId);

    const { data, error } = await supabase
      .from('person_memories')
      .select('*')
      .eq('user_id', userId)
      .eq('person_id', personId)
      .order('importance', { ascending: false })
      .order('last_mentioned_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.log('[Memory] Error fetching memories:', error.message, error.code, error.hint);
      return [];
    }

    console.log('[Memory] Fetched', data?.length || 0, 'memories');
    return data || [];
  } catch (error) {
    console.log('[Memory] Unexpected error fetching memories:', error);
    return [];
  }
}

/**
 * Filter out low-signal memory keys that lack context
 * 
 * @param memories - Array of memory inputs to filter
 * @returns Filtered array with only high-quality memories
 */
function filterLowSignalMemories(memories: PersonMemoryInput[]): PersonMemoryInput[] {
  const filtered = memories.filter((memory) => {
    // Filter out generic age references without context
    if (memory.key === 'age_reference' && !memory.value.includes('kidney') && !memory.value.includes('cancer') && !memory.value.includes('medical')) {
      console.log('[Memory] Filtering out low-signal age_reference:', memory.value);
      return false;
    }

    // Filter out very short values (likely incomplete)
    if (memory.value.trim().length < 3) {
      console.log('[Memory] Filtering out too-short value:', memory.key, memory.value);
      return false;
    }

    // Filter out memories with very low confidence
    if (memory.confidence < 2) {
      console.log('[Memory] Filtering out low-confidence memory:', memory.key, 'confidence:', memory.confidence);
      return false;
    }

    return true;
  });

  if (filtered.length < memories.length) {
    console.log('[Memory] Filtered out', memories.length - filtered.length, 'low-signal memories');
  }

  return filtered;
}

/**
 * Upsert (insert or update) memories for a specific person/topic
 * 
 * CRITICAL: Uses conflict target (user_id, person_id, key) for merge-safe upsert
 * ALWAYS sets updated_at and last_mentioned_at on both INSERT and UPDATE
 * 
 * @param userId - The authenticated user's ID
 * @param personId - The person/topic ID
 * @param memories - Array of memory objects to upsert
 * @returns void (errors are caught silently)
 */
export async function upsertPersonMemories(
  userId: string,
  personId: string,
  memories: PersonMemoryInput[]
): Promise<void> {
  if (!memories || memories.length === 0) {
    console.log('[Memory] No memories to upsert');
    return;
  }

  try {
    // Filter out low-signal memories before upserting
    const filteredMemories = filterLowSignalMemories(memories);

    if (filteredMemories.length === 0) {
      console.log('[Memory] All memories filtered out - nothing to upsert');
      return;
    }

    console.log('[Memory] Upsert start:', { userId, personId, count: filteredMemories.length });

    const now = new Date().toISOString();

    // Prepare records for upsert
    // CRITICAL: Set both updated_at AND last_mentioned_at on every upsert
    // This ensures new inserts have last_mentioned_at set, and updates refresh it
    const updates = filteredMemories.map((memory) => ({
      user_id: userId,
      person_id: personId,
      category: memory.category,
      key: memory.key,
      value: memory.value,
      importance: memory.importance,
      confidence: memory.confidence,
      updated_at: now,
      last_mentioned_at: now, // CRITICAL: Set on both INSERT and UPDATE
    }));

    console.log('[Memory] Prepared', updates.length, 'records for upsert');

    // Perform merge-safe upsert
    // onConflict: 'user_id,person_id,key' ensures we update existing rows instead of creating duplicates
    // ignoreDuplicates: false ensures we UPDATE on conflict (not ignore)
    const { data, error } = await supabase
      .from('person_memories')
      .upsert(updates, {
        onConflict: 'user_id,person_id,key',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.log('[Memory] Upsert error:', {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details,
      });
      return;
    }

    console.log('[Memory] Upsert ok:', data?.length || 0, 'rows affected');
  } catch (error: any) {
    console.log('[Memory] Unexpected error upserting memories:', {
      message: error?.message || 'unknown',
      name: error?.name || 'unknown',
    });
  }
}

/**
 * Update last_mentioned_at timestamp for specific memory keys
 * 
 * @param userId - The authenticated user's ID
 * @param personId - The person/topic ID
 * @param keys - Array of memory keys to touch
 * @returns void (errors are caught silently)
 */
export async function touchMemories(
  userId: string,
  personId: string,
  keys: string[]
): Promise<void> {
  if (!keys || keys.length === 0) {
    return;
  }

  try {
    console.log('[Memory] Touching', keys.length, 'memory keys');

    const { error } = await supabase
      .from('person_memories')
      .update({ last_mentioned_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('person_id', personId)
      .in('key', keys);

    if (error) {
      console.log('[Memory] Error touching memories:', error.message);
    } else {
      console.log('[Memory] Touch complete');
    }
  } catch (error) {
    console.log('[Memory] Unexpected error touching memories:', error);
  }
}
