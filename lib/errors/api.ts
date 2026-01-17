/**
 * API Error Classes
 * 
 * Error classes for API operations including rate limiting and service availability.
 */

import type { ServiceErrorCode } from '@/lib/types';
import { AppError } from './base';

/**
 * Base API error class
 */
export abstract class ApiError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

/**
 * Rate limit exceeded error (429)
 * Thrown when API rate limit is exceeded
 */
export class RateLimitError extends ApiError {
  readonly code = 'RATE_LIMITED' as const;
  readonly statusCode = 429;

  constructor(
    message: string = 'Too many requests. Please try again later.',
    public readonly retryAfterMs?: number,
    cause?: unknown
  ) {
    super(message, cause);
  }
}

/**
 * Service unavailable error (503)
 * Thrown when a service is temporarily unavailable
 */
export class ServiceUnavailableError extends ApiError {
  readonly code = 'EXTERNAL_SERVICE_ERROR' as const;
  readonly statusCode = 503;

  constructor(
    public readonly service: string,
    message?: string,
    cause?: unknown
  ) {
    super(message || `${service} is temporarily unavailable`, cause);
  }
}

/**
 * Bad request error (400)
 * Thrown when request is malformed or invalid
 */
export class BadRequestError extends ApiError {
  readonly code = 'VALIDATION_ERROR' as const;
  readonly statusCode = 400;

  constructor(message: string = 'Bad request', cause?: unknown) {
    super(message, cause);
  }
}

/**
 * Method not allowed error (405)
 * Thrown when HTTP method is not supported for the endpoint
 */
export class MethodNotAllowedError extends ApiError {
  readonly code = 'METHOD_NOT_ALLOWED' as const;
  readonly statusCode = 405;

  constructor(
    public readonly method: string,
    public readonly allowedMethods: string[] = [],
    cause?: unknown
  ) {
    const allowed = allowedMethods.length > 0 
      ? ` Allowed methods: ${allowedMethods.join(', ')}`
      : '';
    super(`Method ${method} not allowed.${allowed}`, cause);
  }
}

/**
 * Request timeout error (408)
 * Thrown when request takes too long to process
 */
export class RequestTimeoutError extends ApiError {
  readonly code = 'REQUEST_TIMEOUT' as const;
  readonly statusCode = 408;

  constructor(
    public readonly timeoutMs: number,
    message?: string,
    cause?: unknown
  ) {
    super(message || `Request timeout after ${timeoutMs}ms`, cause);
  }
}

/**
 * Payload too large error (413)
 * Thrown when request payload exceeds size limit
 */
export class PayloadTooLargeError extends ApiError {
  readonly code = 'PAYLOAD_TOO_LARGE' as const;
  readonly statusCode = 413;

  constructor(
    public readonly maxSize: number,
    public readonly actualSize?: number,
    cause?: unknown
  ) {
    const sizeInfo = actualSize 
      ? `Payload size ${actualSize} bytes exceeds maximum of ${maxSize} bytes`
      : `Payload exceeds maximum size of ${maxSize} bytes`;
    super(sizeInfo, cause);
  }
}

/**
 * Type guard to check if an error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
