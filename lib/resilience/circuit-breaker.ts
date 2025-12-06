/**
 * Circuit Breaker Pattern
 * 
 * Prevents cascading failures by tracking error rates and temporarily
 * blocking requests to failing services.
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests are blocked
 * - HALF_OPEN: Testing if service has recovered
 */

import { logger } from '@/lib/utils/logger';

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Circuit breaker options
 */
export interface CircuitBreakerOptions {
  /** Number of failures before opening circuit */
  failureThreshold?: number;
  /** Number of successes needed to close circuit from half-open */
  successThreshold?: number;
  /** Time in ms before attempting to close circuit */
  resetTimeoutMs?: number;
  /** Time window in ms for tracking failures */
  failureWindowMs?: number;
  /** Function to determine if error should count as failure */
  isFailure?: (error: unknown) => boolean;
  /** Callback when circuit opens */
  onOpen?: () => void;
  /** Callback when circuit closes */
  onClose?: () => void;
  /** Callback when circuit enters half-open */
  onHalfOpen?: () => void;
}

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  totalRequests: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  openedAt: number | null;
}

/**
 * Error thrown when circuit is open
 */
export class CircuitBreakerError extends Error {
  readonly circuitName: string;
  readonly state: CircuitState;

  constructor(circuitName: string, state: CircuitState) {
    super(`Circuit breaker "${circuitName}" is ${state}`);
    this.name = 'CircuitBreakerError';
    this.circuitName = circuitName;
    this.state = state;
  }
}

/**
 * Default circuit breaker options
 */
const DEFAULT_OPTIONS: Required<Omit<CircuitBreakerOptions, 'onOpen' | 'onClose' | 'onHalfOpen'>> = {
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeoutMs: 30000, // 30 seconds
  failureWindowMs: 60000, // 1 minute
  isFailure: () => true,
};

/**
 * Circuit Breaker implementation
 * 
 * @example
 * ```typescript
 * const openaiBreaker = new CircuitBreaker('openai-api', {
 *   failureThreshold: 3,
 *   resetTimeoutMs: 60000,
 *   onOpen: () => console.log('OpenAI circuit opened!'),
 * });
 * 
 * try {
 *   const result = await openaiBreaker.execute(() => callOpenAI(prompt));
 * } catch (error) {
 *   if (error instanceof CircuitBreakerError) {
 *     // Circuit is open, use fallback
 *     return fallbackResponse();
 *   }
 *   throw error;
 * }
 * ```
 */
export class CircuitBreaker {
  private readonly name: string;
  private readonly options: Required<Omit<CircuitBreakerOptions, 'onOpen' | 'onClose' | 'onHalfOpen'>>;
  private readonly callbacks: Pick<CircuitBreakerOptions, 'onOpen' | 'onClose' | 'onHalfOpen'>;
  
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private totalRequests: number = 0;
  private failureTimestamps: number[] = [];
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private openedAt: number | null = null;

  constructor(name: string, options: CircuitBreakerOptions = {}) {
    this.name = name;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.callbacks = {
      onOpen: options.onOpen,
      onClose: options.onClose,
      onHalfOpen: options.onHalfOpen,
    };
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      openedAt: this.openedAt,
    };
  }

  /**
   * Check if circuit should transition from OPEN to HALF_OPEN
   */
  private shouldAttemptReset(): boolean {
    if (this.state !== CircuitState.OPEN || !this.openedAt) {
      return false;
    }
    return Date.now() - this.openedAt >= this.options.resetTimeoutMs;
  }

  /**
   * Clean up old failure timestamps outside the window
   */
  private cleanupOldFailures(): void {
    const cutoff = Date.now() - this.options.failureWindowMs;
    this.failureTimestamps = this.failureTimestamps.filter(ts => ts > cutoff);
  }

  /**
   * Record a successful operation
   */
  private recordSuccess(): void {
    this.successes++;
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successes >= this.options.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }
  }

  /**
   * Record a failed operation
   */
  private recordFailure(error: unknown): void {
    if (!this.options.isFailure(error)) {
      return; // Don't count this as a circuit-breaking failure
    }

    this.failures++;
    this.lastFailureTime = Date.now();
    this.failureTimestamps.push(Date.now());

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open immediately opens circuit
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      this.cleanupOldFailures();
      if (this.failureTimestamps.length >= this.options.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    logger.info(`Circuit breaker "${this.name}" transitioned`, {
      from: oldState,
      to: newState,
      failures: this.failures,
      successes: this.successes,
    });

    switch (newState) {
      case CircuitState.OPEN:
        this.openedAt = Date.now();
        this.successes = 0;
        this.callbacks.onOpen?.();
        break;
      case CircuitState.HALF_OPEN:
        this.successes = 0;
        this.callbacks.onHalfOpen?.();
        break;
      case CircuitState.CLOSED:
        this.failures = 0;
        this.failureTimestamps = [];
        this.openedAt = null;
        this.callbacks.onClose?.();
        break;
    }
  }

  /**
   * Execute a function through the circuit breaker
   * 
   * @throws CircuitBreakerError if circuit is open
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if we should attempt reset
    if (this.shouldAttemptReset()) {
      this.transitionTo(CircuitState.HALF_OPEN);
    }

    // Block if circuit is open
    if (this.state === CircuitState.OPEN) {
      throw new CircuitBreakerError(this.name, this.state);
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error);
      throw error;
    }
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.failures = 0;
    this.successes = 0;
    this.failureTimestamps = [];
    this.openedAt = null;
    this.transitionTo(CircuitState.CLOSED);
  }

  /**
   * Manually open the circuit (for testing or emergency)
   */
  open(): void {
    this.transitionTo(CircuitState.OPEN);
  }
}

/**
 * Registry for managing multiple circuit breakers
 */
class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker
   */
  getBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    let breaker = this.breakers.get(name);
    if (!breaker) {
      breaker = new CircuitBreaker(name, options);
      this.breakers.set(name, breaker);
    }
    return breaker;
  }

  /**
   * Get all circuit breakers
   */
  getAllBreakers(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  /**
   * Get stats for all breakers
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

/**
 * Global circuit breaker registry
 */
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

/**
 * Predefined circuit breaker configurations
 */
export const CircuitBreakerPresets = {
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
