/**
 * Database Error Classes
 * 
 * Error classes for database operations including queries, constraints, and transactions.
 */

import type { ServiceErrorCode } from '@/lib/types';
import { AppError } from './base';

/**
 * Base database error class
 */
export abstract class DatabaseError extends AppError {
  constructor(
    message: string,
    public readonly operation?: string,
    cause?: unknown
  ) {
    super(message, cause);
  }
}

/**
 * Record not found error
 * Thrown when a database query returns no results
 */
export class RecordNotFoundError extends DatabaseError {
  readonly code = 'NOT_FOUND' as ServiceErrorCode;
  readonly statusCode = 404;

  constructor(
    public readonly entity: string,
    public readonly identifier?: string | number,
    operation?: string
  ) {
    const message = identifier
      ? `${entity} with ID '${identifier}' not found`
      : `${entity} not found`;
    super(message, operation);
  }
}

/**
 * Unique constraint violation error
 * Thrown when trying to insert/update with duplicate unique field
 */
export class UniqueConstraintError extends DatabaseError {
  readonly code = 'CONFLICT' as ServiceErrorCode;
  readonly statusCode = 409;

  constructor(
    public readonly entity: string,
    public readonly field: string,
    public readonly value?: string,
    cause?: unknown
  ) {
    const message = value
      ? `${entity} with ${field} '${value}' already exists`
      : `${entity} with this ${field} already exists`;
    super(message, 'insert/update', cause);
  }
}

/**
 * Foreign key constraint violation error
 * Thrown when trying to insert/update with invalid foreign key reference
 */
export class ForeignKeyConstraintError extends DatabaseError {
  readonly code = 'VALIDATION_ERROR' as ServiceErrorCode;
  readonly statusCode = 400;

  constructor(
    public readonly entity: string,
    public readonly field: string,
    public readonly referencedEntity: string,
    cause?: unknown
  ) {
    super(
      `Invalid ${field}: referenced ${referencedEntity} does not exist`,
      'insert/update',
      cause
    );
  }
}

/**
 * Database connection error
 * Thrown when unable to connect to database
 */
export class DatabaseConnectionError extends DatabaseError {
  readonly code = 'EXTERNAL_SERVICE_ERROR' as ServiceErrorCode;
  readonly statusCode = 503;

  constructor(message: string = 'Database connection failed', cause?: unknown) {
    super(message, 'connect', cause);
  }
}

/**
 * Database transaction error
 * Thrown when a transaction fails or is rolled back
 */
export class DatabaseTransactionError extends DatabaseError {
  readonly code = 'INTERNAL_ERROR' as ServiceErrorCode;
  readonly statusCode = 500;

  constructor(message: string = 'Database transaction failed', cause?: unknown) {
    super(message, 'transaction', cause);
  }
}

/**
 * Database query error
 * Generic error for database query failures
 */
export class DatabaseQueryError extends DatabaseError {
  readonly code = 'INTERNAL_ERROR' as ServiceErrorCode;
  readonly statusCode = 500;

  constructor(message: string, operation?: string, cause?: unknown) {
    super(message, operation, cause);
  }
}

/**
 * Type guard to check if an error is a database error
 */
export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}
