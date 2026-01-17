/**
 * Service Wrapper - Error Handler
 * 
 * Centralized error handling logic for service operations.
 */

import { ZodError } from 'zod';
import { logger } from '@/lib/utils/logger';
import { failure } from '@/lib/types';
import type { ServiceErrorCode } from '@/lib/types';
import type { ServiceWrapperOptions } from './types';
import { AppError } from '@/lib/errors';
import { appErrorToServiceCode } from './errors';

export function handleServiceError<T>(
  error: unknown,
  operation: string,
  logErrors: boolean,
  context?: Record<string, unknown>
): import('@/lib/types/service-result').ServiceResult<T> {
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

  if (error instanceof AppError) {
    if (logErrors && error.statusCode >= 500) {
      logger.error(`Error in ${operation}`, error.cause, context);
    }
    return failure(error.message, appErrorToServiceCode(error));
  }

  if (error instanceof ServiceOperationError) {
    if (logErrors && error.code === 'INTERNAL_ERROR') {
      logger.error(`Error in ${operation}`, error.cause, context);
    }
    return failure(error.message, error.code);
  }

  if (logErrors) {
    logger.error(`Error in ${operation}`, error, context);
  }

  const errorMessage = error instanceof Error ? error.message : `Failed to ${operation}`;
  return failure(errorMessage, 'INTERNAL_ERROR');
}

import { ServiceOperationError } from './errors';
