
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
      console.log('[PersonMemory] Error fetching memories:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.log('[PersonMemory] Unexpected error fetching memories:', error);
    return [];
  }
}

/**
 * Upsert (insert or update) memories for a specific person/topic
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
    return;
  }

  try {
    const updates = memories.map((memory) => ({
      user_id: userId,
      person_id: personId,
      category: memory.category,
      key: memory.key,
      value: memory.value,
      importance: memory.importance,
      confidence: memory.confidence,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('person_memories')
      .upsert(updates, {
        onConflict: 'user_id,person_id,key',
        ignoreDuplicates: false,
      });

    if (error) {
      console.log('[PersonMemory] Error upserting memories:', error.message);
    }
  } catch (error) {
    console.log('[PersonMemory] Unexpected error upserting memories:', error);
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
    const { error } = await supabase
      .from('person_memories')
      .update({ last_mentioned_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('person_id', personId)
      .in('key', keys);

    if (error) {
      console.log('[PersonMemory] Error touching memories:', error.message);
    }
  } catch (error) {
    console.log('[PersonMemory] Unexpected error touching memories:', error);
  }
}
