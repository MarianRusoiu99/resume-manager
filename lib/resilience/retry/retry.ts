/**
 * Retry Module - Retry
 * 
 * Main retry implementation.
 */

import { logger } from '@/lib/utils/logger';
import type { RetryOptions } from './types';
import { calculateDelay, sleep, DEFAULT_OPTIONS } from './utils';

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const result = await fn();
      
      if (attempt > 1) {
        logger.info(`Retry succeeded on attempt ${attempt}`, {
          operation: opts.operationName,
          attempts: attempt,
          durationMs: Date.now() - startTime,
        });
      }
      
      return result;
    } catch (error) {
      lastError = error;

      const shouldRetry = attempt < opts.maxAttempts && opts.isRetryable(error);

      if (!shouldRetry) {
        logger.warn(`Operation failed after ${attempt} attempts`, {
          operation: opts.operationName,
          error: error instanceof Error ? error.message : String(error),
          attempts: attempt,
          durationMs: Date.now() - startTime,
        });
        throw error;
      }

      const delayMs = calculateDelay(attempt, opts);

      logger.debug(`Retry attempt ${attempt} failed, retrying in ${delayMs}ms`, {
        operation: opts.operationName,
        error: error instanceof Error ? error.message : String(error),
        nextAttempt: attempt + 1,
        delayMs,
      });

      options.onRetry?.(attempt, error, delayMs);

      await sleep(delayMs);
    }
  }

  throw lastError;
}

export function createRetryWrapper(defaultOptions: RetryOptions) {
  return <T>(fn: () => Promise<T>, overrideOptions?: RetryOptions): Promise<T> => {
    return withRetry(fn, { ...defaultOptions, ...overrideOptions });
  };
}
