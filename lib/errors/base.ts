/**
 * Base Application Error Class
 * 
 * This file is separated to prevent circular dependencies.
 * All error classes should extend from AppError defined here.
 */

import type { ErrorCodeType } from '../types';

/**
 * Base application error class
 */
export abstract class AppError extends Error {
  abstract readonly code: ErrorCodeType;
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
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
