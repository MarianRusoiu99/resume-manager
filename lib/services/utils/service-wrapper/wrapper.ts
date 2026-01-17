/**
 * Service Wrapper - Wrapper Functions
 * 
 * Main wrapper functions for service operations.
 */

import { success } from '@/lib/types';
import type { ServiceResult } from '@/lib/types';
import type { ServiceWrapperOptions } from './types';
import { handleServiceError } from './error-handler';

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
