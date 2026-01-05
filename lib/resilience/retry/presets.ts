/**
 * Retry Module - Presets
 * 
 * Predefined retry configurations for common use cases.
 */

import type { RetryOptions } from './types';

export const RetryPresets = {
  quick: {
    maxAttempts: 2,
    initialDelayMs: 50,
    backoff: 'fixed' as const,
  },
  
  standard: {
    maxAttempts: 3,
    initialDelayMs: 100,
    backoff: 'exponential' as const,
  },
  
  aggressive: {
    maxAttempts: 5,
    initialDelayMs: 200,
    maxDelayMs: 30000,
    backoff: 'exponential' as const,
  },
  
  ai: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoff: 'exponential' as const,
    isRetryable: (error: unknown) => {
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return message.includes('rate') || 
               message.includes('timeout') ||
               message.includes('503') ||
               message.includes('502') ||
               message.includes('500');
      }
      return true;
    },
  } as RetryOptions,
};
