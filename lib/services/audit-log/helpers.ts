import type { AuditAction } from '@prisma/client';

import type { AuditLogEntry } from './types';
import { auditLogService } from '.';

/**
 * Convenience functions for common audit operations.
 */
export const auditLog = {
  success: (
    action: AuditAction,
    userId: string,
    options?: Omit<AuditLogEntry, 'action' | 'userId' | 'success'>
  ) => {
    auditLogService.logAsync({
      action,
      userId,
      success: true,
      ...options,
    });
  },

  failure: (
    action: AuditAction,
    userId: string | undefined,
    errorMessage: string,
    options?: Omit<AuditLogEntry, 'action' | 'userId' | 'success' | 'errorMessage'>
  ) => {
    auditLogService.logAsync({
      action,
      userId,
      success: false,
      errorMessage,
      ...options,
    });
  },

  auth: (
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE',
    userId: string | undefined,
    success: boolean,
    options?: Omit<AuditLogEntry, 'action' | 'userId' | 'success'>
  ) => {
    auditLogService.logAsync({
      action,
      userId,
      success,
      ...options,
    });
  },

  resource: (
    action: AuditAction,
    userId: string,
    resourceType: string,
    resourceId: string,
    options?: Omit<AuditLogEntry, 'action' | 'userId' | 'resourceType' | 'resourceId'>
  ) => {
    auditLogService.logAsync({
      action,
      userId,
      resourceType,
      resourceId,
      success: true,
      ...options,
    });
  },
};
