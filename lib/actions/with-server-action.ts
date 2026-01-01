/**
 * Server Action Wrapper
 * 
 * Provides a unified wrapper for all server actions that:
 * - Handles authentication consistently via DAL
 * - Adds structured logging
 * - Provides consistent error handling
 * - Integrates with audit logging
 * 
 * Usage:
 * ```typescript
 * export const getProfile = withServerAction(
 *   'getProfile',
 *   async (session, profileId: string) => {
 *     return await profileService.getProfile(profileId, session.user.id);
 *   }
 * );
 * ```
 */

import { getSession } from '@/lib/auth/dal';
import { logger, isServiceResult, serviceResultToActionResult, failureActionResult } from '@/lib/utils';
import { auditLog } from '@/lib/services';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/lib/actions/types';
import { isAppError, wrapError } from '@/lib/errors';

// Import AuditAction type - may not exist if migration hasn't run
type AuditAction = 
  | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE'
  | 'PROFILE_CREATE' | 'PROFILE_UPDATE' | 'PROFILE_DELETE' | 'PROFILE_SET_DEFAULT' | 'PROFILE_PUBLISH'
  | 'RESUME_CREATE' | 'RESUME_UPDATE' | 'RESUME_DELETE' | 'RESUME_GENERATE' | 'RESUME_EXPORT_PDF'
  | 'COVER_LETTER_CREATE' | 'COVER_LETTER_UPDATE' | 'COVER_LETTER_DELETE' | 'COVER_LETTER_GENERATE'
  | 'TEMPLATE_CREATE' | 'TEMPLATE_UPDATE' | 'TEMPLATE_DELETE'
  | 'API_KEY_ADD' | 'API_KEY_UPDATE' | 'API_KEY_DELETE'
  | 'SETTINGS_UPDATE';

/**
 * Session type for authenticated users
 */
export interface ActionSession {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    isAdmin: boolean;
  };
}

/**
 * Options for server action wrapper
 */
export interface ServerActionOptions {
  /** Audit action to log (optional) */
  auditAction?: AuditAction;
  /** Resource type for audit logging */
  resourceType?: string;
  /** Whether to skip authentication (default: false) */
  isPublic?: boolean;
  /** Whether to require admin (default: false) */
  requireAdmin?: boolean;
  /** Paths to revalidate on success */
  revalidatePaths?: string[];
}

/**
 * Wrap a server action with authentication, logging, and error handling
 * 
 * @param actionName - Name of the action for logging
 * @param handler - The action handler function
 * @param options - Optional configuration
 * @returns Wrapped action function
 */
type MaybeServiceResult<T> = T | import('@/lib/types/service-result').ServiceResult<T>;

export function wononithServerAction<TArgs extends unknown[], TResult>(
  actionName: string,
  handler: (session: ActionSession, ...args: TArgs) => Promise<MaybeServiceResult<TResult>>,
  options: ServerActionOptions = {}
): (...args: TArgs) => Promise<ActionResult<TResult>> {
  return createServerAction(actionName, handler, options);
}

export function withServerAction<TArgs extends unknown[], TResult>(
  actionName: string,
  handler: (session: ActionSession, ...args: TArgs) => Promise<MaybeServiceResult<TResult>>,
  options: ServerActionOptions = {}
): (...args: TArgs) => Promise<ActionResult<TResult>> {
  return createServerAction(actionName, handler, options);
}

function createServerAction<TArgs extends unknown[], TResult>(
  actionName: string,
  handler: (session: ActionSession, ...args: TArgs) => Promise<MaybeServiceResult<TResult>>,
  options: ServerActionOptions = {}
): (...args: TArgs) => Promise<ActionResult<TResult>> {
  return async (...args: TArgs): Promise<ActionResult<TResult>> => {
    const startTime = Date.now();

    try {
      // Authentication check via DAL
      const session = await getSession();
      
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

      // Execute the handler
      const handlerResult = await handler(actionSession, ...args);

      // If handler returns a ServiceResult, unwrap consistently
      if (isServiceResult<TResult>(handlerResult)) {
        if (!handlerResult.success) {
          if (options.auditAction && session?.userId) {
            auditLog.failure(options.auditAction, session.userId, handlerResult.error, {
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
          const resourceId = extractResourceId(handlerResult.data);
          auditLog.success(options.auditAction, session.userId, {
            resourceType: options.resourceType,
            resourceId,
            metadata: { duration },
          });
        }

        return { success: true, data: handlerResult.data };
      }

      const result = handlerResult as TResult;

      // Calculate duration
      const duration = Date.now() - startTime;

      // Log success
      logger.info(`${actionName} completed`, {
        userId: actionSession.user.id,
        duration,
      });

      // Revalidate paths if configured
      if (options.revalidatePaths) {
        for (const path of options.revalidatePaths) {
          revalidatePath(path);
        }
      }

      // Audit log if configured
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

      // Log error
      logger.error(`${actionName} failed`, error, {
        duration,
      });

      const wrapped = isAppError(error) ? error : wrapError(error, errorMessage);

      // Audit log failure if configured
      if (options.auditAction) {
        const session = await getSession().catch(() => null);
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

/**
 * Create a server action without authentication requirement
 * 
 * @param actionName - Name of the action for logging
 * @param handler - The action handler function
 * @returns Wrapped action function
 */
export function withPublicAction<TArgs extends unknown[], TResult>(
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

/**
 * Extract resource ID from action result for audit logging
 */
function extractResourceId(result: unknown): string | undefined {
  if (result && typeof result === 'object') {
    if ('id' in result && typeof result.id === 'string') {
      return result.id;
    }
    if ('data' in result && typeof result.data === 'object' && result.data && 'id' in result.data) {
      return (result.data as { id: string }).id;
    }
  }
  return undefined;
}
