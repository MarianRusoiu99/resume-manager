/**
 * Server Action Wrapper
 * 
 * Provides a unified wrapper for all server actions that:
 * - Handles authentication consistently via DAL
 * - Adds structured logging
 * - Provides consistent error handling
 * - Integrates with audit logging
 */

export type { ActionResult, AuditAction, MaybeServiceResult, ActionSession, ServerActionOptions } from './types';
export { extractResourceId } from './helpers';
export { createServerAction } from './action-creator';
export { createPublicAction } from './public-actions';

import type { MaybeServiceResult, ServerActionOptions, ActionSession, ActionResult } from './types';
import { createServerAction } from './action-creator';

export function withServerAction<TArgs extends unknown[], TResult>(
  actionName: string,
  handler: (session: ActionSession, ...args: TArgs) => Promise<MaybeServiceResult<TResult>>,
  options: ServerActionOptions = {}
): (...args: TArgs) => Promise<ActionResult<TResult>> {
  return createServerAction(actionName, handler, options);
}

import { createPublicAction } from './public-actions';

export function withPublicAction<TArgs extends unknown[], TResult>(
  actionName: string,
  handler: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<ActionResult<TResult>> {
  return createPublicAction(actionName, handler);
}
