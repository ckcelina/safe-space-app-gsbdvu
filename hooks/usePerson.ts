
/**
 * usePerson Hook
 * 
 * Hook for fetching a single person by ID.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Person } from '@/types/database.types';
import { handleSupabaseError } from '@/lib/errors/errorHandler';

export interface UsePersonReturn {
  person: Person | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching a single person
 * 
 * @param userId - The user ID
 * @param personId - The person ID to fetch
 * @returns Object with person data, loading state, error state, and refetch function
 * 
 * @example
 * ```tsx
 * const { person, loading, error, refetch } = usePerson(userId, personId);
 * 
 * if (loading) return <LoadingState />;
 * if (error) return <ErrorState message={error.message} onRetry={refetch} />;
 * if (!person) return <EmptyState title="Person not found" />;
 * 
 * return <PersonDetails person={person} />;
 * ```
 */
export function usePerson(
  userId: string | null | undefined,
  personId: string | null | undefined
): UsePersonReturn {
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPerson = useCallback(async () => {
    if (!userId || !personId) {
      setPerson(null);
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
        .eq('id', personId)
        .single();

      if (fetchError) {
        throw handleSupabaseError(fetchError);
      }

      setPerson(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('[usePerson] Error fetching person:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, personId]);

  useEffect(() => {
    fetchPerson();
  }, [fetchPerson]);

  return {
    person,
    loading,
    error,
    refetch: fetchPerson,
  };
}

