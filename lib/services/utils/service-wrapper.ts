/**
 * Service Wrapper Utilities
 * 
 * Provides utilities to reduce boilerplate in service methods:
 * - Standardized error handling
 * - Automatic logging
 * - Consistent ServiceResult wrapping
 */

import { ZodError } from 'zod';
import { logger } from '@/lib/utils/logger';
import { success, failure, type ServiceResult, type ServiceErrorCode } from '@/lib/types/service-result';
import { AppError } from '@/lib/errors';

// Re-export error classes for convenience
export { 
  AppError, 
  NotFoundError, 
  ValidationError, 
  UnauthorizedError, 
  ForbiddenError, 
  ConflictError, 
  RateLimitError, 
  ExternalServiceError 
} from '@/lib/errors';

/**
 * Map AppError code to ServiceErrorCode
 */
function appErrorToServiceCode(error: AppError): ServiceErrorCode {
  const codeMap: Record<string, ServiceErrorCode> = {
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    CONFLICT: 'CONFLICT',
    RATE_LIMITED: 'RATE_LIMITED',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
    CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
  };
  return codeMap[error.code] ?? 'INTERNAL_ERROR';
}

/**
 * Options for the service wrapper
 */
interface ServiceWrapperOptions {
  /** Custom error message prefix (default: 'Failed to') */
  errorPrefix?: string;
  /** Whether to log errors (default: true) */
  logErrors?: boolean;
  /** Additional context for logging */
  context?: Record<string, unknown>;
}

/**
 * Wraps a service operation with standardized error handling
 * 
 * Automatically:
 * - Catches and handles errors
 * - Logs errors with context
 * - Returns consistent ServiceResult
 * - Handles ZodError specially
 * 
 * @example
 * ```typescript
 * // Before (verbose):
 * async getProfile(id: string): Promise<ServiceResult<Profile>> {
 *   try {
 *     const profile = await this.repository.findById(id);
 *     if (!profile) return failure('Profile not found', 'NOT_FOUND');
 *     return success(profile);
 *   } catch (error) {
 *     logger.error('Error fetching profile', error);
 *     return failure('Failed to fetch profile', 'INTERNAL_ERROR');
 *   }
 * }
 * 
 * // After (concise):
 * async getProfile(id: string): Promise<ServiceResult<Profile>> {
 *   return withServiceError('fetch profile', async () => {
 *     const profile = await this.repository.findById(id);
 *     if (!profile) throw new NotFoundError('Profile');
 *     return profile;
 *   });
 * }
 * ```
 */
export async function withServiceError<T>(
  operation: string,
  fn: () => Promise<T>,
  options: ServiceWrapperOptions = {}
): Promise<ServiceResult<T>> {
  const { logErrors = true, context } = options;

  try {
    const data = await fn();
    return success(data);
  } catch (error) {
    return handleServiceError(error, operation, logErrors, context);
  }
}

/**
 * Centralized error handler to reduce cognitive complexity
 */
function handleServiceError<T>(
  error: unknown,
  operation: string,
  logErrors: boolean,
  context?: Record<string, unknown>
): ServiceResult<T> {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const messages = error.issues.map(e => e.message).join(', ');
    if (logErrors) {
      logger.warn(`Validation error in ${operation}`, { 
        ...context, 
        errors: error.issues.length,
        fields: error.issues.map(e => e.path.join('.'))
      });
    }
    return failure(messages, 'VALIDATION_ERROR');
  }

  // Handle typed AppError instances (from lib/errors)
  if (error instanceof AppError) {
    if (logErrors && error.statusCode >= 500) {
      logger.error(`Error in ${operation}`, error.cause, context);
    }
    return failure(error.message, appErrorToServiceCode(error));
  }

  // Handle legacy ServiceOperationError
  if (error instanceof ServiceOperationError) {
    if (logErrors && error.code === 'INTERNAL_ERROR') {
      logger.error(`Error in ${operation}`, error.cause, context);
    }
    return failure(error.message, error.code);
  }

  // Handle generic errors
  if (logErrors) {
    logger.error(`Error in ${operation}`, error, context);
  }

  const errorMessage = error instanceof Error ? error.message : `Failed to ${operation}`;
  return failure(errorMessage, 'INTERNAL_ERROR');
}

/**
 * Synchronous version of withServiceError for non-async operations
 */
export function withServiceErrorSync<T>(
  operation: string,
  fn: () => T,
  options: ServiceWrapperOptions = {}
): ServiceResult<T> {
  const { logErrors = true, context } = options;

  try {
    const data = fn();
    return success(data);
  } catch (error) {
    return handleServiceError(error, operation, logErrors, context);
  }
}

/**
 * Custom error class for service operations
 * 
 * Use this to throw errors with specific error codes that will be
 * properly handled by withServiceError.
 * 
 * @example
 * ```typescript
 * throw new ServiceOperationError('Profile not found', 'NOT_FOUND');
 * throw new ServiceOperationError('Cannot delete active profile', 'CONFLICT');
 * ```
 */
export class ServiceOperationError extends Error {
  constructor(
    message: string,
    public readonly code: ServiceErrorCode = 'INTERNAL_ERROR',
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'ServiceOperationError';
  }
}

/**
 * Convenience error factories for common scenarios
 */
export const ServiceErrors = {
  notFound: (resource: string) => 
    new ServiceOperationError(`${resource} not found`, 'NOT_FOUND'),
  
  unauthorized: (message = 'Unauthorized') => 
    new ServiceOperationError(message, 'UNAUTHORIZED'),
  
  forbidden: (message = 'Access denied') => 
    new ServiceOperationError(message, 'FORBIDDEN'),
  
  conflict: (message: string) => 
    new ServiceOperationError(message, 'CONFLICT'),
  
  validation: (message: string) => 
    new ServiceOperationError(message, 'VALIDATION_ERROR'),
  
  rateLimited: (message = 'Too many requests') => 
    new ServiceOperationError(message, 'RATE_LIMITED'),
  
  externalService: (message: string, cause?: unknown) => 
    new ServiceOperationError(message, 'EXTERNAL_SERVICE_ERROR', cause),
};

/**
 * Type guard to check if an error is a ServiceOperationError
 */
export function isServiceOperationError(error: unknown): error is ServiceOperationError {
  return error instanceof ServiceOperationError;
}

/**
 * Helper to run multiple service operations and collect results
 * 
 * @example
 * ```typescript
 * const [profileResult, resumesResult] = await runParallel(
 *   profileService.getProfile(userId),
 *   resumeService.listResumes(userId)
 * );
 * ```
 */
export async function runParallel<T extends ServiceResult<unknown>[]>(
  ...operations: { [K in keyof T]: Promise<T[K]> }
): Promise<T> {
  return Promise.all(operations) as Promise<T>;
}

/**
 * Chain multiple service operations, stopping on first failure
 * 
 * @example
 * ```typescript
 * const result = await chainOperations(
 *   () => profileService.getProfile(profileId, userId),
 *   (profile) => resumeService.generateFromProfile(profile, jobDescription),
 *   (resume) => templateService.applyTemplate(resume, templateId)
 * );
 * ```
 */
export async function chainOperations<A, B>(
  first: () => Promise<ServiceResult<A>>,
  second: (a: A) => Promise<ServiceResult<B>>
): Promise<ServiceResult<B>>;
export async function chainOperations<A, B, C>(
  first: () => Promise<ServiceResult<A>>,
  second: (a: A) => Promise<ServiceResult<B>>,
  third: (b: B) => Promise<ServiceResult<C>>
): Promise<ServiceResult<C>>;
export async function chainOperations<A, B, C, D>(
  first: () => Promise<ServiceResult<A>>,
  second: (a: A) => Promise<ServiceResult<B>>,
  third: (b: B) => Promise<ServiceResult<C>>,
  fourth: (c: C) => Promise<ServiceResult<D>>
): Promise<ServiceResult<D>>;
export async function chainOperations(
  ...operations: Array<(arg?: unknown) => Promise<ServiceResult<unknown>>>
): Promise<ServiceResult<unknown>> {
  let result: ServiceResult<unknown> = success(undefined);
  
  for (const operation of operations) {
    if (!result.success) return result;
    result = await operation(result.data);
  }
  
  return result;
}
