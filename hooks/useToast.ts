
/**
 * Toast Hook
 * 
 * Provides a consistent interface for showing toast notifications
 * throughout the app.
 */

import { useCallback } from 'react';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

export interface ToastOptions {
  duration?: number;
}

export interface UseToastReturn {
  error: (message: string, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
}

/**
 * Hook for showing toast notifications
 * 
 * @example
 * ```tsx
 * const { error, success } = useToast();
 * 
 * const handleSave = async () => {
 *   try {
 *     await saveData();
 *     success('Data saved successfully!');
 *   } catch (err) {
 *     error('Failed to save data');
 *   }
 * };
 * ```
 */
export function useToast(): UseToastReturn {
  const error = useCallback((message: string, options?: ToastOptions) => {
    showErrorToast(message);
  }, []);

  const success = useCallback((message: string, options?: ToastOptions) => {
    showSuccessToast(message);
  }, []);

  const info = useCallback((message: string, options?: ToastOptions) => {
    // For now, use success toast for info messages
    // Can be enhanced later if needed
    showSuccessToast(message);
  }, []);

  return {
    error,
    success,
    info,
  };
}

