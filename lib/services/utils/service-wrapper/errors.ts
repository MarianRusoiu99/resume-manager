/**
 * Service Wrapper - Error Classes
 * 
 * Error handling classes and utilities for service operations.
 */

import type { ErrorCodeType } from '../../../types';
import { 
  AppError, 
  NotFoundError, 
  ValidationError, 
  UnauthorizedError, 
  ForbiddenError, 
  ConflictError, 
  RateLimitError, 
  ExternalServiceError 
} from '../../../errors';

export { 
  AppError, 
  NotFoundError, 
  ValidationError, 
  UnauthorizedError, 
  ForbiddenError, 
  ConflictError, 
  RateLimitError, 
  ExternalServiceError 
};

/**
 * @deprecated Use specific AppError subclasses instead. This class will be removed in a future version.
 */
export class ServiceOperationError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCodeType = 'INTERNAL_ERROR',
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'ServiceOperationError';
  }
}

export function appErrorToServiceCode(error: AppError): ErrorCodeType {
  const codeMap: Record<string, ErrorCodeType> = {
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

export function isServiceOperationError(error: unknown): error is ServiceOperationError {
  return error instanceof ServiceOperationError;
}

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
