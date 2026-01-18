/**
 * Server Action Wrapper - Action Creator
 * 
 * Creates wrapped server actions with authentication, error handling, and audit logging.
 */

import { getSession } from '@/lib/auth/dal';
import { logger, isServiceResult, serviceResultToActionResult, failureActionResult } from '@/lib/utils';
import { auditLog } from '@/lib/services';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/lib/actions/types';
import type { MaybeServiceResult } from './types';
import type { ActionSession, ServerActionOptions, AuditAction } from './types';
import { isAppError, wrapError } from '@/lib/errors';
import { extractResourceId } from './helpers';

export function createServerAction<TArgs extends unknown[], TResult>(
  actionName: string,
  handler: (session: ActionSession, ...args: TArgs) => Promise<MaybeServiceResult<TResult>>,
  options: ServerActionOptions = {}
): (...args: TArgs) => Promise<ActionResult<TResult>> {
  return async (...args: TArgs): Promise<ActionResult<TResult>> => {
    const startTime = Date.now();
    let session: Awaited<ReturnType<typeof getSession>> | null = null;

    try {
      session = await getSession();
      
      if (!options.isPublic && !session?.userId) {
        logger.warn(`Unauthorized ${actionName} attempt`);
        return failureActionResult('Unauthorized', 'UNAUTHORIZED');
      }

      if (options.requireAdmin && !session?.isAdmin) {
        logger.warn(`Forbidden (admin required) ${actionName} attempt`, { userId: session?.userId });
        return failureActionResult('Forbidden', 'FORBIDDEN');
      }

      const actionSession: ActionSession = {
        user: {
          id: session?.userId || '',
          email: session?.email,
          name: session?.name,
          isAdmin: Boolean(session?.isAdmin),
        },
      };

      const handlerResult = await handler(actionSession, ...args);

      if (isServiceResult<TResult>(handlerResult)) {
        if (!handlerResult.success) {
          if (options.auditAction && session?.userId) {
            auditLog.failure(options.auditAction, session.userId, (handlerResult as any).error, {
              resourceType: options.resourceType,
            });
          }
          return serviceResultToActionResult(handlerResult);
        }

        const duration = Date.now() - startTime;

        logger.info(`${actionName} completed`, {
          userId: actionSession.user.id,
          duration,
        });

        if (options.revalidatePaths) {
          for (const path of options.revalidatePaths) {
            revalidatePath(path);
          }
        }

        if (options.auditAction && session?.userId) {
          const resourceId = extractResourceId((handlerResult as any).data);
          auditLog.success(options.auditAction, session.userId, {
            resourceType: options.resourceType,
            resourceId,
            metadata: { duration },
          });
        }

        return { success: true, data: (handlerResult as any).data };
      }

      const result = handlerResult as TResult;

      const duration = Date.now() - startTime;

      logger.info(`${actionName} completed`, {
        userId: actionSession.user.id,
        duration,
      });

      if (options.revalidatePaths) {
        for (const path of options.revalidatePaths) {
          revalidatePath(path);
        }
      }

      if (options.auditAction && session?.userId) {
        const resourceId = extractResourceId(result);
        auditLog.success(options.auditAction, session.userId, {
          resourceType: options.resourceType,
          resourceId,
          metadata: { duration },
        });
      }

      return { success: true, data: result };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error(`${actionName} failed`, error, {
        duration,
      });

      const wrapped = isAppError(error) ? error : wrapError(error, errorMessage);

      if (options.auditAction) {
        auditLog.failure(
          options.auditAction,
          session?.userId,
          wrapped.message,
          {
            resourceType: options.resourceType,
            metadata: { duration, code: wrapped.code },
          }
        );
      }

      return failureActionResult(wrapped.message, wrapped.code);
    }
  };
}
