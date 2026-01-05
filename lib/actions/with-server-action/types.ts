/**
 * Server Action Wrapper - Types
 * 
 * Type definitions for server action wrapper.
 */

import type { ActionResult } from '@/lib/actions/types';

export type { ActionResult };

type AuditAction = 
  | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE'
  | 'PROFILE_CREATE' | 'PROFILE_UPDATE' | 'PROFILE_DELETE' | 'PROFILE_SET_DEFAULT' | 'PROFILE_PUBLISH'
  | 'RESUME_CREATE' | 'RESUME_UPDATE' | 'RESUME_DELETE' | 'RESUME_GENERATE' | 'RESUME_EXPORT_PDF'
  | 'COVER_LETTER_CREATE' | 'COVER_LETTER_UPDATE' | 'COVER_LETTER_DELETE' | 'COVER_LETTER_GENERATE'
  | 'TEMPLATE_CREATE' | 'TEMPLATE_UPDATE' | 'TEMPLATE_DELETE'
  | 'API_KEY_ADD' | 'API_KEY_UPDATE' | 'API_KEY_DELETE'
  | 'SETTINGS_UPDATE';

export type { AuditAction };

export interface ActionSession {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    isAdmin: boolean;
  };
}

export interface ServerActionOptions {
  auditAction?: AuditAction;
  resourceType?: string;
  isPublic?: boolean;
  requireAdmin?: boolean;
  revalidatePaths?: string[];
}

type MaybeServiceResult<T> = T | import('@/lib/types/service-result').ServiceResult<T>;
export type { MaybeServiceResult };
