import type { AuditAction } from '@prisma/client';

/**
 * Audit log entry interface.
 */
export interface AuditLogEntry {
  userId?: string | null;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  success?: boolean;
  errorMessage?: string;
}

/**
 * Request context for extracting audit metadata.
 */
export interface AuditRequestContext {
  headers?: Headers;
  ip?: string;
}

/**
 * Audit log query options.
 */
export interface AuditLogQueryOptions {
  userId?: string;
  action?: AuditAction;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  limit?: number;
  offset?: number;
}

export type { AuditAction };
