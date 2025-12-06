/**
 * Application Error Classes
 * 
 * Typed error classes for consistent error handling across the application.
 * Each error class maps to a specific HTTP status code and error type.
 * 
 * @example
 * ```typescript
 * import { NotFoundError, ValidationError } from '@/lib/errors';
 * 
 * throw new NotFoundError('Profile');
 * throw new ValidationError('Invalid email format');
 * ```
 */

import type { ServiceErrorCode } from '@/lib/types/service-result';

/**
 * Base application error class
 */
export abstract class AppError extends Error {
  abstract readonly code: ServiceErrorCode;
  abstract readonly statusCode: number;

  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON() {
    return {
      error: this.message,
      code: this.code,
      name: this.name,
    };
  }
}

/**
 * Resource not found error (404)
 */
export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND' as const;
  readonly statusCode = 404;

  constructor(resource: string = 'Resource') {
    super(`${resource} not found`);
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR' as const;
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly field?: string,
    public readonly details?: Record<string, string>[]
  ) {
    super(message);
  }
}

/**
 * Authentication error (401)
 */
export class UnauthorizedError extends AppError {
  readonly code = 'UNAUTHORIZED' as const;
  readonly statusCode = 401;

  constructor(message: string = 'Authentication required') {
    super(message);
  }
}

/**
 * Authorization/permission error (403)
 */
export class ForbiddenError extends AppError {
  readonly code = 'FORBIDDEN' as const;
  readonly statusCode = 403;

  constructor(message: string = 'Access denied') {
    super(message);
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  readonly code = 'CONFLICT' as const;
  readonly statusCode = 409;
}

/**
 * Rate limit exceeded error (429)
 */
export class RateLimitError extends AppError {
  readonly code = 'RATE_LIMITED' as const;
  readonly statusCode = 429;

  constructor(
    message: string = 'Too many requests',
    public readonly retryAfter?: number
  ) {
    super(message);
  }
}

/**
 * External service error (502)
 */
export class ExternalServiceError extends AppError {
  readonly code = 'EXTERNAL_SERVICE_ERROR' as const;
  readonly statusCode = 502;

  constructor(
    service: string,
    message?: string,
    cause?: unknown
  ) {
    super(message || `${service} service unavailable`, cause);
  }
}

/**
 * Internal server error (500)
 */
export class InternalError extends AppError {
  readonly code = 'INTERNAL_ERROR' as const;
  readonly statusCode = 500;

  constructor(message: string = 'Internal server error', cause?: unknown) {
    super(message, cause);
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Get HTTP status code from any error
 */
export function getErrorStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode;
  }
  return 500;
}

/**
 * Get error code from any error
 */
export function getErrorCode(error: unknown): ServiceErrorCode {
  if (isAppError(error)) {
    return error.code;
  }
  return 'INTERNAL_ERROR';
}

/**
 * Create an appropriate AppError from an unknown error
 */
export function wrapError(error: unknown, defaultMessage = 'An error occurred'): AppError {
  if (isAppError(error)) {
    return error;
  }
  
  if (error instanceof Error) {
    return new InternalError(error.message, error);
  }
  
  return new InternalError(defaultMessage, error);
}
