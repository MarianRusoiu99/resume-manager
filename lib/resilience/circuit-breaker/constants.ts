/**
 * Predefined circuit breaker configurations
 */

import { CircuitBreakerOptions } from './types';

export const CircuitBreakerPresets: Record<string, CircuitBreakerOptions> = {
  /** For AI/LLM providers */
  ai: {
    failureThreshold: 3,
    successThreshold: 2,
    resetTimeoutMs: 60000, // 1 minute
    failureWindowMs: 120000, // 2 minutes
  },
  
  /** For external APIs */
  api: {
    failureThreshold: 5,
    successThreshold: 2,
    resetTimeoutMs: 30000,
    failureWindowMs: 60000,
  },
  
  /** For database operations */
  database: {
    failureThreshold: 3,
    successThreshold: 1,
    resetTimeoutMs: 10000,
    failureWindowMs: 30000,
  },
};

/**
 * Default circuit breaker options
 */
export const DEFAULT_CIRCUIT_OPTIONS: Required<Omit<CircuitBreakerOptions, 'onOpen' | 'onClose' | 'onHalfOpen'>> = {
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeoutMs: 30000, // 30 seconds
  failureWindowMs: 60000, // 1 minute
  isFailure: () => true,
};
