/**
 * Retry Module - Utils
 * 
 * Utility functions for retry logic.
 */

import type { BackoffStrategy, RetryOptions } from './types';

export function calculateDelay(
  attempt: number,
  options: Required<Omit<RetryOptions, 'onRetry' | 'operationName'>>
): number {
  let delay: number;

  switch (options.backoff) {
    case 'fixed':
      delay = options.initialDelayMs;
      break;
    case 'linear':
      delay = options.initialDelayMs * attempt * options.backoffMultiplier;
      break;
    case 'exponential':
    default:
      delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1);
      break;
  }

  delay = Math.min(delay, options.maxDelayMs);

  if (options.jitter) {
    const jitterFactor = 0.75 + Math.random() * 0.5;
    delay = Math.round(delay * jitterFactor);
  }

  return delay;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'operationName'>> = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 10000,
  backoff: 'exponential',
  backoffMultiplier: 2,
  jitter: true,
  isRetryable: () => true,
};
