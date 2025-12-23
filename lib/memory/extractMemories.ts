
import { supabase } from '../supabase';

const EXTRACT_MEMORIES_URL = process.env.EXPO_PUBLIC_EXTRACT_MEMORIES_URL;

export const extractMemories = async (
  text: string,
  userId: string,
  personId: string
): Promise<{ memories: any[]; mentioned_keys: string[] }> => {
  try {
    if (!EXTRACT_MEMORIES_URL) {
      __DEV__ && console.debug('EXTRACT_MEMORIES_URL is not defined');
      return { memories: [], mentioned_keys: [] };
    }

    const response = await supabase.functions.invoke('extract-memories', {
      body: JSON.stringify({ text, user_id: userId, person_id: personId }),
    });

    if (response.error) {
      __DEV__ && console.debug('Edge Function error:', response.error);
      return { memories: [], mentioned_keys: [] };
    }

    const data = response.data as { memories: any[]; mentioned_keys: string[] };

    if (!data || !Array.isArray(data.memories) || !Array.isArray(data.mentioned_keys)) {
      __DEV__ && console.debug('Invalid data format from Edge Function:', data);
      return { memories: [], mentioned_keys: [] };
    }

    return { memories: data.memories, mentioned_keys: data.mentioned_keys };
  } catch (error: any) {
    __DEV__ && console.debug('Unexpected error during memory extraction:', error);
    return { memories: [], mentioned_keys: [] };
  }
};
