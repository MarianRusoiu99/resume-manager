'use client';

import { toast } from 'sonner';

interface UseToastActionOptions {
  successMessage: string;
  errorMessage?: string;
}

/**
 * Small helper to run async actions with consistent toast handling.
 * - Supports `ActionResult<T>`-shaped results (`{ success: boolean; error?: string }`).
 * - Falls back to try/catch for throwing functions.
 */
export function useToastAction() {
  const runWithToast = async <T>(
    action: () => Promise<T>,
    options: UseToastActionOptions,
  ): Promise<T | null> => {
    try {
      const result = await action();

      if (typeof result === 'object' && result !== null && 'success' in result) {
        const maybeResult = result as { success: boolean; error?: string };
        if (!maybeResult.success) {
          toast.error(maybeResult.error || options.errorMessage || 'Something went wrong');
          return null;
        }
      }

      toast.success(options.successMessage);
      return result;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : options.errorMessage || 'Something went wrong',
      );
      return null;
    }
  };

  return { runWithToast };
}
