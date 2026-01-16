
/**
 * usePersons Hook
 * 
 * Hook for fetching and managing person list.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Person } from '@/types/database.types';
import { handleSupabaseError } from '@/lib/errors/errorHandler';

export interface UsePersonsReturn {
  persons: Person[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching persons
 * 
 * @param userId - The user ID to fetch persons for
 * @returns Object with persons list, loading state, error state, and refetch function
 * 
 * @example
 * ```tsx
 * const { persons, loading, error, refetch } = usePersons(userId);
 * 
 * if (loading) return <LoadingState />;
 * if (error) return <ErrorState message={error.message} onRetry={refetch} />;
 * 
 * return (
 *   <FlatList
 *     data={persons}
 *     renderItem={({ item }) => <PersonCard person={item} />}
 *   />
 * );
 * ```
 */
export function usePersons(userId: string | null | undefined): UsePersonsReturn {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPersons = useCallback(async () => {
    if (!userId) {
      setPersons([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw handleSupabaseError(fetchError);
      }

      setPersons(data || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('[usePersons] Error fetching persons:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPersons();
  }, [fetchPersons]);

  return {
    persons,
    loading,
    error,
    refetch: fetchPersons,
  };
}

