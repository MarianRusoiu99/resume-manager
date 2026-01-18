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

import type { ServiceErrorCode } from '../types';
import { AppError, isAppError } from './base';

// Re-export base error class and type guard
export { AppError, isAppError } from './base';

/**
 * Resource not found error (404)
 */
export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND' as const;
  readonly statusCode = 404;

  constructor(resource: string = 'Resource', cause?: unknown) {
    super(`${resource} not found`, cause);
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
    public readonly details?: Record<string, string>[],
    cause?: unknown
  ) {
    super(message, cause);
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  readonly code = 'CONFLICT' as const;
  readonly statusCode = 409;

  constructor(message: string = 'Conflict', cause?: unknown) {
    super(message, cause);
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
 * Configuration error (500)
 */
export class ConfigurationError extends AppError {
  readonly code = 'CONFIGURATION_ERROR' as const;
  readonly statusCode = 500;

  constructor(message: string = 'System configuration error', cause?: unknown) {
    super(message, cause);
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
    // Common configuration failures should carry a stable code
    if (error.message.toLowerCase().includes('environment configuration')) {
      return new ConfigurationError(error.message, error);
    }

    return new InternalError(error.message, error);
  }

  return new InternalError(defaultMessage, error);
}

// Re-export AI-specific errors
export {
  AIError,
  AIProviderError,
  AIProviderNotConfiguredError,
  UnsupportedProviderError,
  InvalidAPIKeyError,
  ModelNotFoundError,
  AIRateLimitError,
  AIContextLengthError,
  AIQuotaExceededError,
  isAIError,
  createAIErrorFromResponse,
} from './ai';

// Re-export database errors
export {
  DatabaseError,
  RecordNotFoundError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
  DatabaseConnectionError,
  DatabaseTransactionError,
  DatabaseQueryError,
  isDatabaseError,
} from './database';

// Re-export authentication errors
export {
  AuthenticationError,
  UnauthorizedError,
  ForbiddenError,
  InvalidCredentialsError,
  SessionExpiredError,
  InvalidTokenError,
  AccountLockedError,
  isAuthenticationError,
} from './authentication';

// Re-export API errors
export {
  ApiError,
  RateLimitError,
  ServiceUnavailableError,
  BadRequestError,
  MethodNotAllowedError,
  RequestTimeoutError,
  PayloadTooLargeError,
  isApiError,
} from './api';

// Re-export validation errors
export {
  ValidationError as TypedValidationError,
  SchemaValidationError,
  RequiredFieldError,
  InvalidFieldError,
  FieldLengthError,
  InvalidFormatError,
  isValidationError,
} from './validation';
