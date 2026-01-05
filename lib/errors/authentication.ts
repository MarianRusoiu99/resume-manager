/**
 * Authentication and Authorization Error Classes
 * 
 * Error classes for authentication and authorization operations.
 */

import type { ServiceErrorCode } from '@/lib/types/service-result';
import { AppError } from './base';

/**
 * Base authentication error class
 */
export abstract class AuthenticationError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

/**
 * Unauthorized error (401)
 * Thrown when authentication is required but not provided or invalid
 */
export class UnauthorizedError extends AuthenticationError {
  readonly code = 'UNAUTHORIZED' as ServiceErrorCode;
  readonly statusCode = 401;

  constructor(message: string = 'Authentication required') {
    super(message);
  }
}

/**
 * Forbidden error (403)
 * Thrown when user is authenticated but doesn't have permission
 */
export class ForbiddenError extends AuthenticationError {
  readonly code = 'FORBIDDEN' as ServiceErrorCode;
  readonly statusCode = 403;

  constructor(message: string = 'Access denied') {
    super(message);
  }
}

/**
 * Invalid credentials error
 * Thrown when login credentials are incorrect
 */
export class InvalidCredentialsError extends AuthenticationError {
  readonly code = 'UNAUTHORIZED' as ServiceErrorCode;
  readonly statusCode = 401;

  constructor(message: string = 'Invalid email or password') {
    super(message);
  }
}

/**
 * Session expired error
 * Thrown when user session has expired
 */
export class SessionExpiredError extends AuthenticationError {
  readonly code = 'UNAUTHORIZED' as ServiceErrorCode;
  readonly statusCode = 401;

  constructor(message: string = 'Session expired. Please log in again.') {
    super(message);
  }
}

/**
 * Invalid token error
 * Thrown when authentication token is invalid or malformed
 */
export class InvalidTokenError extends AuthenticationError {
  readonly code = 'UNAUTHORIZED' as ServiceErrorCode;
  readonly statusCode = 401;

  constructor(message: string = 'Invalid authentication token') {
    super(message);
  }
}

/**
 * Account locked error
 * Thrown when user account is locked (e.g., too many failed login attempts)
 */
export class AccountLockedError extends AuthenticationError {
  readonly code = 'FORBIDDEN' as ServiceErrorCode;
  readonly statusCode = 403;

  constructor(
    message: string = 'Account is locked',
    public readonly unlockTime?: Date
  ) {
    super(message);
  }
}

/**
 * Type guard to check if an error is an authentication error
 */
export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}
