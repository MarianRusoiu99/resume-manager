/**
 * Service Result Types
 * 
 * Provides unified result types for all service layer operations.
 * Ensures consistency in error handling across the application.
 */

import type { ErrorCodeType } from './error-codes';

/**
 * Unified result type for service operations
 * All services should return this type for consistency
 */
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: ErrorCodeType };

/**
 * Create a successful result
 */
export function success<T>(data: T): ServiceResult<T> {
  return { success: true, data };
}

/**
 * Create a failure result
 */
export function failure(error: string, code?: ErrorCodeType): ServiceResult<never> {
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
export function isFailure<T>(result: ServiceResult<T>): result is { success: false; error: string; code?: ErrorCodeType } {
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
