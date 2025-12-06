/**
 * Combined Resilience Utilities
 * 
 * Combines retry, timeout, and circuit breaker into a single wrapper.
 */

import { withRetry, RetryOptions, RetryPresets } from './retry';
import { withTimeout, TimeoutOptions, TimeoutPresets } from './timeout';
import { CircuitBreaker, CircuitBreakerOptions, circuitBreakerRegistry } from './circuit-breaker';

/**
 * Combined resilience options
 */
export interface ResilienceOptions {
  /** Retry configuration */
  retry?: RetryOptions | keyof typeof RetryPresets | false;
  /** Timeout configuration */
  timeout?: TimeoutOptions | keyof typeof TimeoutPresets | false;
  /** Circuit breaker name (uses registry) or configuration */
  circuitBreaker?: string | { name: string; options?: CircuitBreakerOptions } | false;
  /** Operation name for logging */
  operationName?: string;
}

/**
 * Execute a function with combined resilience patterns
 * 
 * Order of execution:
 * 1. Circuit breaker check (fail fast if open)
 * 2. Timeout wrapper
 * 3. Retry logic (will retry on timeout too)
 * 
 * @example
 * ```typescript
 * const result = await withResilience(
 *   () => callOpenAI(prompt),
 *   {
 *     retry: 'ai',
 *     timeout: 'ai',
 *     circuitBreaker: 'openai-api',
 *     operationName: 'Generate Resume',
 *   }
 * );
 * ```
 */
export async function withResilience<T>(
  fn: () => Promise<T>,
  options: ResilienceOptions = {}
): Promise<T> {
  const { operationName } = options;

  // Resolve retry options
  let retryOpts: RetryOptions | false = false;
  if (options.retry !== false && options.retry !== undefined) {
    retryOpts = typeof options.retry === 'string' 
      ? { ...RetryPresets[options.retry], operationName }
      : { ...options.retry, operationName };
  }

  // Resolve timeout options
  let timeoutOpts: TimeoutOptions | false = false;
  if (options.timeout !== false && options.timeout !== undefined) {
    timeoutOpts = typeof options.timeout === 'string'
      ? { ...TimeoutPresets[options.timeout], operationName }
      : { ...options.timeout, operationName };
  }

  // Resolve circuit breaker
  let circuitBreaker: CircuitBreaker | null = null;
  if (options.circuitBreaker !== false && options.circuitBreaker !== undefined) {
    if (typeof options.circuitBreaker === 'string') {
      circuitBreaker = circuitBreakerRegistry.getBreaker(options.circuitBreaker);
    } else {
      circuitBreaker = circuitBreakerRegistry.getBreaker(
        options.circuitBreaker.name,
        options.circuitBreaker.options
      );
    }
  }

  // Build the execution chain
  let execution = fn;

  // Wrap with timeout if configured
  if (timeoutOpts) {
    const timeoutFn = execution;
    execution = () => withTimeout(timeoutFn, timeoutOpts as TimeoutOptions);
  }

  // Wrap with retry if configured
  if (retryOpts) {
    const retryFn = execution;
    execution = () => withRetry(retryFn, retryOpts as RetryOptions);
  }

  // Wrap with circuit breaker if configured
  if (circuitBreaker) {
    const breakerFn = execution;
    execution = () => circuitBreaker!.execute(breakerFn);
  }

  return execution();
}

/**
 * Create a resilient wrapper with preset options
 * 
 * @example
 * ```typescript
 * const resilientAI = createResilientWrapper({
 *   retry: 'ai',
 *   timeout: 'ai',
 *   circuitBreaker: 'openai-api',
 * });
 * 
 * const result = await resilientAI(() => generateResume(input));
 * ```
 */
export function createResilientWrapper(defaultOptions: ResilienceOptions) {
  return <T>(fn: () => Promise<T>, overrideOptions?: ResilienceOptions): Promise<T> => {
    return withResilience(fn, { ...defaultOptions, ...overrideOptions });
  };
}

/**
 * Predefined resilience configurations for common use cases
 */
export const ResiliencePresets = {
  /** For AI/LLM operations */
  ai: {
    retry: 'ai' as const,
    timeout: 'ai' as const,
    circuitBreaker: 'ai-provider',
  },

  /** For external API calls */
  api: {
    retry: 'standard' as const,
    timeout: 'standard' as const,
    circuitBreaker: 'external-api',
  },

  /** For database operations */
  database: {
    retry: 'quick' as const,
    timeout: 'quick' as const,
    circuitBreaker: false as const,
  },

  /** For PDF export */
  export: {
    retry: 'standard' as const,
    timeout: 'export' as const,
    circuitBreaker: false as const,
  },
};
