/**
 * Server Action Wrapper - Public Actions
 * 
 * Public action wrappers without authentication requirements.
 */

import { logger, failureActionResult } from '@/lib/utils';
import type { ActionResult } from '@/lib/actions/types';
import { isAppError, wrapError } from '@/lib/errors';

export function createPublicAction<TArgs extends unknown[], TResult>(
  actionName: string,
  handler: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<ActionResult<TResult>> {
  return async (...args: TArgs): Promise<ActionResult<TResult>> => {
    const startTime = Date.now();

    try {
      const result = await handler(...args);
      const duration = Date.now() - startTime;

      logger.info(`${actionName} completed`, { duration });

      return { success: true, data: result };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error(`${actionName} failed`, error, { duration });

      const wrapped = isAppError(error) ? error : wrapError(error, errorMessage);

      return failureActionResult(wrapped.message, wrapped.code);
    }
  };
}
