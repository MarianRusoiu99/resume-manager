/**
 * Timeout Utility
 * 
 * Wraps async operations with a timeout to prevent hanging.
 */

import { logger } from '@/lib/utils/logger';

/**
 * Timeout options
 */
export interface TimeoutOptions {
  /** Timeout in milliseconds */
  timeoutMs: number;
  /** Custom error message */
  message?: string;
  /** Operation name for logging */
  operationName?: string;
}

/**
 * Error thrown when operation times out
 */
export class TimeoutError extends Error {
  readonly timeoutMs: number;
  readonly operationName?: string;

  constructor(timeoutMs: number, operationName?: string, message?: string) {
    super(message || `Operation timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
    this.operationName = operationName;
  }
}

/**
 * Execute a function with a timeout
 * 
 * @param fn - The async function to execute
 * @param options - Timeout options
 * @returns Promise resolving to the function result
 * @throws TimeoutError if the operation times out
 * 
 * @example
 * ```typescript
 * try {
 *   const result = await withTimeout(
 *     () => slowApiCall(),
 *     { timeoutMs: 5000, operationName: 'API Call' }
 *   );
 * } catch (error) {
 *   if (error instanceof TimeoutError) {
 *     console.log('Operation timed out');
 *   }
 * }
 * ```
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  options: TimeoutOptions
): Promise<T> {
  const { timeoutMs, message, operationName } = options;

  return new Promise<T>((resolve, reject) => {
    let timeoutId: NodeJS.Timeout | null = null;
    let settled = false;

    // Set up timeout
    timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        
        logger.warn(`Operation timed out`, {
          operation: operationName,
          timeoutMs,
        });
        
        reject(new TimeoutError(timeoutMs, operationName, message));
      }
    }, timeoutMs);

    // Execute the function
    fn()
      .then((result) => {
        if (!settled) {
          settled = true;
          if (timeoutId) clearTimeout(timeoutId);
          resolve(result);
        }
      })
      .catch((error) => {
        if (!settled) {
          settled = true;
          if (timeoutId) clearTimeout(timeoutId);
          reject(error);
        }
      });
  });
}

/**
 * Create a timeout wrapper with preset options
 * 
 * @example
 * ```typescript
 * const withApiTimeout = createTimeoutWrapper({ timeoutMs: 10000 });
 * const result = await withApiTimeout(() => fetch('/api/v1/data'));
 * ```
 */
export function createTimeoutWrapper(defaultOptions: TimeoutOptions) {
  return <T>(fn: () => Promise<T>, overrideOptions?: Partial<TimeoutOptions>): Promise<T> => {
    return withTimeout(fn, { ...defaultOptions, ...overrideOptions });
  };
}

/**
 * Predefined timeout configurations
 */
export const TimeoutPresets = {
  /** Quick operations (database queries, cache) */
  quick: { timeoutMs: 5000 },
  
  /** Standard API calls */
  standard: { timeoutMs: 15000 },
  
  /** Long-running operations */
  long: { timeoutMs: 60000 },
  
  /** AI generation (can take a while) */
  ai: { timeoutMs: 120000 },
  
  /** PDF export */
  export: { timeoutMs: 30000 },
};

/**
 * Race multiple promises and return the first to complete
 * Useful for implementing fallbacks
 * 
 * @example
 * ```typescript
 * const result = await raceWithFallback([
 *   () => primaryApiCall(),
 *   () => fallbackApiCall(),
 * ], { timeoutMs: 5000 });
 * ```
 */
export async function raceWithFallback<T>(
  fns: Array<() => Promise<T>>,
  options: TimeoutOptions
): Promise<T> {
  const promises = fns.map(fn => 
    withTimeout(fn, options).catch(error => {
      // Log but don't throw - let other promises compete
      logger.debug('Race candidate failed', { error: error.message });
      throw error;
    })
  );

  return Promise.any(promises);
}
