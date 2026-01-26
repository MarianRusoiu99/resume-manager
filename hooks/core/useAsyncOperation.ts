import { useState, useCallback } from 'react';

/**
 * Generic hook for handling async operations with loading and error states
 * 
 * @example
 * ```tsx
 * const { isLoading, error, execute } = useAsyncOperation<User>();
 * 
 * const handleSave = async () => {
 *   const result = await execute(() => saveUser(userData));
 *   if (result.success) {
 *     // Handle success
 *   }
 * };
 * ```
 */
export function useAsyncOperation<T>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const execute = useCallback(async (fn: () => Promise<T>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fn();
      return { success: true, data: result };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return { isLoading, error, execute, setError };
}
