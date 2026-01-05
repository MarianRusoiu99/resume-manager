import type { AuditAction } from '@prisma/client';

export { AuditLogService, auditLogService } from './audit-logs.service';
export type { AuditLogEntry, AuditLogQueryOptions, AuditRequestContext, AuditAction } from './types';

// Import the service instance for use in convenience functions
import { auditLogService } from './audit-logs.service';
import type { AuditLogEntry } from './types';

/**
 * Convenience functions for common audit operations.
 * 
 * These helpers provide a simpler API for common audit logging patterns,
 * wrapping the auditLogService with pre-configured parameters.
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
