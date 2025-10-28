/**
 * Retry utility for handling transient failures with exponential backoff
 */

export interface RetryOptions {
  /**
   * Maximum number of retry attempts (default: 3)
   */
  maxAttempts?: number;
  
  /**
   * Initial delay in milliseconds (default: 1000ms)
   */
  initialDelay?: number;
  
  /**
   * Multiplier for exponential backoff (default: 2)
   */
  backoffMultiplier?: number;
  
  /**
   * Function to determine if error is retryable (default: always retry)
   */
  shouldRetry?: (error: Error, attempt: number) => boolean;
  
  /**
   * Callback invoked before each retry attempt
   */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  shouldRetry: () => true,
  onRetry: () => {},
};

/**
 * Retry a function with exponential backoff
 * 
 * @param fn Function to retry
 * @param options Retry configuration options
 * @returns Promise resolving to function result
 * 
 * @example
 * ```ts
 * const result = await retryWithBackoff(
 *   () => callOpenAIApi(),
 *   {
 *     maxAttempts: 3,
 *     onRetry: (err, attempt, delay) => {
 *       console.log(`Retry attempt ${attempt} after ${delay}ms: ${err.message}`);
 *     }
 *   }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry if we've exhausted attempts
      if (attempt >= opts.maxAttempts) {
        break;
      }
      
      // Check if we should retry this error
      if (!opts.shouldRetry(lastError, attempt)) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt - 1);
      
      // Invoke retry callback
      opts.onRetry(lastError, attempt, delay);
      
      // Wait before retrying
      await sleep(delay);
    }
  }
  
  // All retries exhausted, throw last error
  throw lastError!;
}

/**
 * Determine if an error is retryable based on common patterns
 * 
 * @param error Error to check
 * @returns True if error appears retryable
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  // Network errors
  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('econnreset') ||
    message.includes('econnrefused') ||
    message.includes('socket hang up')
  ) {
    return true;
  }
  
  // Rate limiting
  if (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('429')
  ) {
    return true;
  }
  
  // Server errors (5xx)
  if (
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504') ||
    message.includes('internal server error') ||
    message.includes('service unavailable') ||
    message.includes('gateway timeout')
  ) {
    return true;
  }
  
  // OpenAI specific errors
  if (
    message.includes('engine is currently overloaded') ||
    message.includes('server is overloaded')
  ) {
    return true;
  }
  
  return false;
}

/**
 * Sleep for specified milliseconds
 * 
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry configuration optimized for AI API calls
 */
export const AI_RETRY_CONFIG: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 1000, // 1s, 2s, 4s
  backoffMultiplier: 2,
  shouldRetry: isRetryableError,
};
