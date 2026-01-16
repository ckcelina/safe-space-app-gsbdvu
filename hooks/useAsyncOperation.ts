
/**
 * useAsyncOperation Hook
 * 
 * Generic hook for managing async operations with loading, error, and success states.
 */

import { useState, useCallback } from 'react';

export interface UseAsyncOperationOptions<T> {
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
}

export interface UseAsyncOperationReturn<T> {
  execute: (...args: any[]) => Promise<T | undefined>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Hook for managing async operations
 * 
 * @param asyncFn - The async function to execute
 * @param options - Optional callbacks for success/error
 * @returns Object with execute function, loading state, error state, and reset function
 * 
 * @example
 * ```tsx
 * const { execute, loading, error } = useAsyncOperation(
 *   async (data) => {
 *     const result = await saveData(data);
 *     return result;
 *   },
 *   {
 *     onSuccess: (result) => {
 *       toast.success('Data saved!');
 *     },
 *     onError: (error) => {
 *       toast.error('Failed to save');
 *     }
 *   }
 * );
 * 
 * const handleSave = () => {
 *   execute(formData);
 * };
 * ```
 */
export function useAsyncOperation<T>(
  asyncFn: (...args: any[]) => Promise<T>,
  options?: UseAsyncOperationOptions<T>
): UseAsyncOperationReturn<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: any[]): Promise<T | undefined> => {
      setLoading(true);
      setError(null);

      try {
        const result = await asyncFn(...args);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn, options]
  );

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return {
    execute,
    loading,
    error,
    reset,
  };
}

