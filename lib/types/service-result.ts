/**
 * Service Result Types
 * 
 * Provides unified result types for all service layer operations.
 * Ensures consistency in error handling across the application.
 */

/**
 * Unified result type for service operations
 * All services should return this type for consistency
 */
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: ServiceErrorCode };

/**
 * Standard error codes for service operations
 */
export type ServiceErrorCode =
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'CONFIGURATION_ERROR'
  | 'INTERNAL_ERROR';

/**
 * Create a successful result
 */
export function success<T>(data: T): ServiceResult<T> {
  return { success: true, data };
}

/**
 * Create a failure result
 */
export function failure(error: string, code?: ServiceErrorCode): ServiceResult<never> {
  return { success: false, error, code };
}

/**
 * Type guard to check if result is successful
 */
export function isSuccess<T>(result: ServiceResult<T>): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Type guard to check if result is a failure
 */
export function isFailure<T>(result: ServiceResult<T>): result is { success: false; error: string; code?: ServiceErrorCode } {
  return result.success === false;
}

/**
 * Map a successful result to a new type
 */
export function mapSuccess<T, U>(
  result: ServiceResult<T>,
  fn: (data: T) => U
): ServiceResult<U> {
  if (isSuccess(result)) {
    return success(fn(result.data));
  }
  return result;
}

/**
 * Chain service results (flatMap)
 */
export async function chainResult<T, U>(
  result: ServiceResult<T>,
  fn: (data: T) => Promise<ServiceResult<U>>
): Promise<ServiceResult<U>> {
  if (isSuccess(result)) {
    return fn(result.data);
  }
  return result;
}

/**
 * Convert error code to HTTP status
 */
export function errorCodeToStatus(code?: ServiceErrorCode): number {
  switch (code) {
    case 'NOT_FOUND':
      return 404;
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'VALIDATION_ERROR':
      return 400;
    case 'CONFLICT':
      return 409;
    case 'RATE_LIMITED':
      return 429;
    case 'EXTERNAL_SERVICE_ERROR':
      return 502;
    case 'CONFIGURATION_ERROR':
      return 500;
    case 'INTERNAL_ERROR':
    default:
      return 500;
  }
}
