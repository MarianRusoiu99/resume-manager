/**
 * Resilience Module
 * 
 * Provides fault tolerance utilities for external service calls:
 * - Retry with exponential backoff
 * - Timeout wrapper
 * - Circuit breaker pattern
 * 
 * @example
 * ```typescript
 * import { withRetry, withTimeout, CircuitBreaker } from '@/lib/resilience';
 * 
 * // Retry with exponential backoff
 * const result = await withRetry(
 *   () => callExternalApi(),
 *   { maxAttempts: 3, backoff: 'exponential' }
 * );
 * 
 * // Timeout wrapper
 * const data = await withTimeout(
 *   () => slowOperation(),
 *   { timeoutMs: 5000 }
 * );
 * 
 * // Circuit breaker
 * const breaker = new CircuitBreaker('openai-api', { failureThreshold: 5 });
 * const response = await breaker.execute(() => aiProvider.generate(prompt));
 * ```
 */

export {
  withRetry,
  type RetryOptions,
  type RetryResult,
} from './retry';

export {
  withTimeout,
  TimeoutError,
  type TimeoutOptions,
} from './timeout';

export {
  CircuitBreaker,
  CircuitBreakerError,
  CircuitState,
  circuitBreakerRegistry,
  type CircuitBreakerOptions,
  type CircuitBreakerStats,
} from './circuit-breaker';

export {
  withResilience,
  type ResilienceOptions,
} from './combined';
