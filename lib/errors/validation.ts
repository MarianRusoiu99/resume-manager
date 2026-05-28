/**
 * Validation Error Classes
 * 
 * Error classes for input validation and schema validation operations.
 */

import type { ErrorCodeType } from '@/lib/types';
import { AppError } from './base';

/**
 * Base validation error class
 */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR' as ErrorCodeType;
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly field?: string,
    public readonly details?: Record<string, unknown>,
    cause?: unknown
  ) {
    super(message, cause);
  }
}

/**
 * Schema validation error
 * Thrown when data doesn't match expected schema
 */
export class SchemaValidationError extends ValidationError {
  constructor(
    message: string,
    public readonly schema: string,
    public readonly errors?: Array<{ field: string; message: string }>,
    cause?: unknown
  ) {
    super(message, undefined, { schema, errors }, cause);
  }
}

/**
 * Required field missing error
 * Thrown when a required field is not provided
 */
export class RequiredFieldError extends ValidationError {
  constructor(field: string, cause?: unknown) {
    super(`Required field '${field}' is missing`, field, undefined, cause);
  }
}

/**
 * Invalid field value error
 * Thrown when a field value is invalid
 */
export class InvalidFieldError extends ValidationError {
  constructor(
    field: string,
    reason: string,
    public readonly value?: unknown,
    cause?: unknown
  ) {
    super(`Invalid value for field '${field}': ${reason}`, field, { value }, cause);
  }
}

/**
 * Field length error
 * Thrown when field value length is invalid
 */
export class FieldLengthError extends ValidationError {
  constructor(
    field: string,
    public readonly min?: number,
    public readonly max?: number,
    public readonly actual?: number,
    cause?: unknown
  ) {
    let message = `Invalid length for field '${field}'`;
    if (min !== undefined && max !== undefined) {
      message += ` (must be between ${min} and ${max} characters)`;
    } else if (min !== undefined) {
      message += ` (must be at least ${min} characters)`;
    } else if (max !== undefined) {
      message += ` (must be at most ${max} characters)`;
    }
    if (actual !== undefined) {
      message += `. Got ${actual} characters`;
    }
    super(message, field, { min, max, actual }, cause);
  }
}

/**
 * Invalid format error
 * Thrown when field value format is invalid (e.g., email, URL, date)
 */
export class InvalidFormatError extends ValidationError {
  constructor(
    field: string,
    public readonly expectedFormat: string,
    public readonly value?: unknown,
    cause?: unknown
  ) {
    super(
      `Invalid format for field '${field}' (expected ${expectedFormat})`,
      field,
      { expectedFormat, value },
      cause
    );
  }
}

/**
 * Type guard to check if an error is a validation error
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}
