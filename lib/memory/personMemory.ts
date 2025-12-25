
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
 * Upsert (insert or update) memories for a specific person/topic
 * 
 * CRITICAL: Uses conflict target (user_id, person_id, key) for upsert
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
    console.log('[Memory] Upsert start:', { userId, personId, count: memories.length });

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

    console.log('[Memory] Prepared', updates.length, 'records for upsert');

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
