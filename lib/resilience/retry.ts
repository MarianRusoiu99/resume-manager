/**
 * Retry Utility
 * 
 * Provides retry functionality with configurable backoff strategies.
 */

import { logger } from '@/lib/utils/logger';

/**
 * Backoff strategy for retries
 */
export type BackoffStrategy = 'fixed' | 'linear' | 'exponential';

/**
 * Retry options
 */
export interface RetryOptions {
  /** Maximum number of attempts (including initial) */
  maxAttempts?: number;
  /** Initial delay in milliseconds */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds */
  maxDelayMs?: number;
  /** Backoff strategy */
  backoff?: BackoffStrategy;
  /** Multiplier for exponential/linear backoff */
  backoffMultiplier?: number;
  /** Add jitter to delays to prevent thundering herd */
  jitter?: boolean;
  /** Function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean;
  /** Callback for each retry attempt */
  onRetry?: (attempt: number, error: unknown, nextDelayMs: number) => void;
  /** Operation name for logging */
  operationName?: string;
}

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: unknown;
  attempts: number;
  totalDurationMs: number;
}

/**
 * Default retry options
 */
const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'operationName'>> = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 10000,
  backoff: 'exponential',
  backoffMultiplier: 2,
  jitter: true,
  isRetryable: () => true,
};

/**
 * Calculate delay for a given attempt
 */
function calculateDelay(
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

  // Apply max delay cap
  delay = Math.min(delay, options.maxDelayMs);

  // Apply jitter (±25%)
  if (options.jitter) {
    const jitterFactor = 0.75 + Math.random() * 0.5; // 0.75 to 1.25
    delay = Math.round(delay * jitterFactor);
  }

  return delay;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic
 * 
 * @param fn - The async function to execute
 * @param options - Retry options
 * @returns Promise resolving to RetryResult
 * 
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => fetch('https://api.example.com/data'),
 *   { 
 *     maxAttempts: 3, 
 *     backoff: 'exponential',
 *     isRetryable: (error) => error.status >= 500
 *   }
 * );
 * 
 * if (result.success) {
 *   console.log('Data:', result.data);
 * } else {
 *   console.error('Failed after', result.attempts, 'attempts');
 * }
 * ```
 */
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

      // Check if we should retry
      const shouldRetry = attempt < opts.maxAttempts && opts.isRetryable(error);

      if (!shouldRetry) {
        // No more retries
        logger.warn(`Operation failed after ${attempt} attempts`, {
          operation: opts.operationName,
          error: error instanceof Error ? error.message : String(error),
          attempts: attempt,
          durationMs: Date.now() - startTime,
        });
        throw error;
      }

      // Calculate delay for next attempt
      const delayMs = calculateDelay(attempt, opts);

      logger.debug(`Retry attempt ${attempt} failed, retrying in ${delayMs}ms`, {
        operation: opts.operationName,
        error: error instanceof Error ? error.message : String(error),
        nextAttempt: attempt + 1,
        delayMs,
      });

      // Call retry callback if provided
      options.onRetry?.(attempt, error, delayMs);

      // Wait before next attempt
      await sleep(delayMs);
    }
  }

  // Should not reach here, but TypeScript needs this
  throw lastError;
}

/**
 * Create a retry wrapper with preset options
 * 
 * @example
 * ```typescript
 * const retryAI = createRetryWrapper({ 
 *   maxAttempts: 3, 
 *   operationName: 'AI Generation' 
 * });
 * 
 * const result = await retryAI(() => generateResume(input));
 * ```
 */
export function createRetryWrapper(defaultOptions: RetryOptions) {
  return <T>(fn: () => Promise<T>, overrideOptions?: RetryOptions): Promise<T> => {
    return withRetry(fn, { ...defaultOptions, ...overrideOptions });
  };
}

/**
 * Predefined retry configurations for common use cases
 */
export const RetryPresets = {
  /** Quick retry for transient failures */
  quick: {
    maxAttempts: 2,
    initialDelayMs: 50,
    backoff: 'fixed' as const,
  },
  
  /** Standard retry for API calls */
  standard: {
    maxAttempts: 3,
    initialDelayMs: 100,
    backoff: 'exponential' as const,
  },
  
  /** Aggressive retry for critical operations */
  aggressive: {
    maxAttempts: 5,
    initialDelayMs: 200,
    maxDelayMs: 30000,
    backoff: 'exponential' as const,
  },
  
  /** AI-specific retry (longer delays, fewer attempts) */
  ai: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoff: 'exponential' as const,
    isRetryable: (error: unknown) => {
      // Retry on rate limits and server errors
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
  },
};
