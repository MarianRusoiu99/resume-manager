/**
 * Retry Policy Configuration
 * 
 * Centralized retry strategies for handling AI API failures
 */

export interface RetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

/**
 * Default retry policy for AI operations
 */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'rate_limit_exceeded',
    'timeout',
    'server_error',
    '429',  // Too many requests
    '500',  // Internal server error
    '502',  // Bad gateway
    '503',  // Service unavailable
    '504'   // Gateway timeout
  ]
};

/**
 * Aggressive retry policy for critical operations
 */
export const AGGRESSIVE_RETRY_POLICY: RetryPolicy = {
  ...DEFAULT_RETRY_POLICY,
  maxAttempts: 5,
  maxDelayMs: 30000
};

/**
 * Conservative retry policy for non-critical operations
 */
export const CONSERVATIVE_RETRY_POLICY: RetryPolicy = {
  ...DEFAULT_RETRY_POLICY,
  maxAttempts: 2,
  initialDelayMs: 500,
  maxDelayMs: 5000
};

/**
 * Check if an error is retryable based on policy
 */
export function isRetryableError(error: Error, policy: RetryPolicy = DEFAULT_RETRY_POLICY): boolean {
  const errorMessage = error.message.toLowerCase();
  const errorCode = (error as NodeJS.ErrnoException).code;

  return policy.retryableErrors.some(retryableError => {
    const retryableErrorLower = retryableError.toLowerCase();
    return (
      errorMessage.includes(retryableErrorLower) ||
      errorCode === retryableError
    );
  });
}

/**
 * Calculate delay for next retry attempt with exponential backoff
 */
export function calculateRetryDelay(
  attempt: number,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY
): number {
  const delay = policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attempt - 1);
  return Math.min(delay, policy.maxDelayMs);
}

/**
 * Retry configuration for different operations
 */
export const RETRY_CONFIGS = {
  JOB_ANALYSIS: DEFAULT_RETRY_POLICY,
  PROFILE_MATCHING: DEFAULT_RETRY_POLICY,
  CONTENT_OPTIMIZATION: AGGRESSIVE_RETRY_POLICY,  // Most critical
  FORMAT_VALIDATION: CONSERVATIVE_RETRY_POLICY,
  COVER_LETTER: DEFAULT_RETRY_POLICY
} as const;
