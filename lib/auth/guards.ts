import { ForbiddenError, NotFoundError } from '@/lib/errors';

export function requireOwnership(params: {
  resourceUserId: string;
  sessionUserId: string;
  message?: string;
}): void {
  if (params.resourceUserId !== params.sessionUserId) {
    throw new ForbiddenError(params.message ?? 'Forbidden');
  }
}

export function requireFound<T>(value: T | null | undefined, resourceName = 'Resource'): T {
  if (value === null || value === undefined) {
    throw new NotFoundError(resourceName);
  }
  return value;
}
