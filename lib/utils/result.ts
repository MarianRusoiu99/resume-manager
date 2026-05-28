import type { ErrorCodeType, ServiceResult } from '@/lib/types';
import type { ActionResult } from '@/lib/actions/types';

export function isServiceResult<T>(value: unknown): value is ServiceResult<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as { success?: unknown }).success === 'boolean'
  );
}

export function serviceResultToActionResult<T>(result: ServiceResult<T>): ActionResult<T> {
  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, error: (result as { error: string }).error, code: (result as { code?: ErrorCodeType }).code };
}

export function failureActionResult(error: string, code?: ErrorCodeType): ActionResult<never> {
  return { success: false, error, code };
}
