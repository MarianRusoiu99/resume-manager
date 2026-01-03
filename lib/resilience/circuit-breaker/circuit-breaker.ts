/**
 * Circuit Breaker Pattern Implementation
 */

import { logger } from '@/lib/utils/logger';
import { 
  CircuitState, 
  CircuitBreakerOptions, 
  CircuitBreakerStats, 
  CircuitBreakerError 
} from './types';
import { DEFAULT_CIRCUIT_OPTIONS } from './constants';

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
    this.options = { ...DEFAULT_CIRCUIT_OPTIONS, ...options };
    this.callbacks = {
      onOpen: options.onOpen,
      onClose: options.onClose,
      onHalfOpen: options.onHalfOpen,
    };
  }

  getState(): CircuitState {
    return this.state;
  }

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

  private shouldAttemptReset(): boolean {
    if (this.state !== CircuitState.OPEN || !this.openedAt) {
      return false;
    }
    return Date.now() - this.openedAt >= this.options.resetTimeoutMs;
  }

  private cleanupOldFailures(): void {
    const cutoff = Date.now() - this.options.failureWindowMs;
    this.failureTimestamps = this.failureTimestamps.filter(ts => ts > cutoff);
  }

  private recordSuccess(): void {
    this.successes++;
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successes >= this.options.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }
  }

  private recordFailure(error: unknown): void {
    if (!this.options.isFailure(error)) {
      return; 
    }

    this.failures++;
    this.lastFailureTime = Date.now();
    this.failureTimestamps.push(Date.now());

    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      this.cleanupOldFailures();
      if (this.failureTimestamps.length >= this.options.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

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

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    if (this.shouldAttemptReset()) {
      this.transitionTo(CircuitState.HALF_OPEN);
    }

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

  reset(): void {
    this.failures = 0;
    this.successes = 0;
    this.failureTimestamps = [];
    this.openedAt = null;
    this.transitionTo(CircuitState.CLOSED);
  }

  open(): void {
    this.transitionTo(CircuitState.OPEN);
  }
}
