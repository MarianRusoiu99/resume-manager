/**
 * Retry Module - Types
 * 
 * Type definitions for retry functionality.
 */

export type BackoffStrategy = 'fixed' | 'linear' | 'exponential';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoff?: BackoffStrategy;
  backoffMultiplier?: number;
  jitter?: boolean;
  isRetryable?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown, nextDelayMs: number) => void;
  operationName?: string;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: unknown;
  attempts: number;
  totalDurationMs: number;
}
