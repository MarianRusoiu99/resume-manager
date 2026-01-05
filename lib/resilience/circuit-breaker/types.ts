/**
 * Circuit breaker states and types
 */

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
