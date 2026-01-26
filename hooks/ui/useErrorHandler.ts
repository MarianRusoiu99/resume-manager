"use client";

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useComponentLogger } from '@/hooks';

export interface ErrorOptions {
  title?: string;
  description?: string;
  silent?: boolean;
  onRetry?: () => void;
}

/**
 * Hook for standardized error handling in UI components
 */
export function useErrorHandler(componentName: string) {
  const log = useComponentLogger(componentName);

  const handleError = useCallback((error: unknown, options: ErrorOptions = {}) => {
    const { title = "Error", description, silent = false, onRetry } = options;
    
    // Log the error
    log.error(description || "An error occurred", error);

    if (silent) return;

    // Determine message
    let message = "An unexpected error occurred. Please try again.";
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = String((error as { message: unknown }).message);
    }

    // Show toast
    toast.error(title, {
      description: message,
      action: onRetry ? {
        label: 'Retry',
        onClick: onRetry
      } : undefined
    });

    return message;
  }, [log]);

  return { handleError };
}
