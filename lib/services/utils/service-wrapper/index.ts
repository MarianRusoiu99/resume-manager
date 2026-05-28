/**
 * Service Wrapper Module
 * 
 * Provides utilities to reduce boilerplate in service methods:
 * - Standardized error handling
 * - Automatic logging
 * - Consistent ServiceResult wrapping
 */

export type { ServiceResult, ErrorCodeType, ServiceWrapperOptions } from './types';
export { 
  AppError, 
  NotFoundError, 
  ValidationError, 
  UnauthorizedError, 
  ForbiddenError, 
  ConflictError, 
  RateLimitError, 
  ExternalServiceError 
} from './errors';
export { 
  ServiceOperationError, 
  appErrorToServiceCode, 
  isServiceOperationError, 
  ServiceErrors 
} from './errors';
export { handleServiceError } from './error-handler';
export { withServiceError, withServiceErrorSync } from './wrapper';
export { runParallel, chainOperations } from './utils';
