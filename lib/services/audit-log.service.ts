/**
 * Audit Log Service
 * 
 * Provides comprehensive audit logging for security-sensitive operations.
 * Implements defense-in-depth by tracking all user actions for:
 * - Security monitoring and incident response
 * - Compliance requirements (GDPR, SOC2)
 * - User activity analysis
 * - Debugging and support
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/utils';
import type { AuditAction } from '@prisma/client';

/**
 * Audit log entry interface
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
 * Request context for extracting audit metadata
 */
export interface AuditRequestContext {
  headers?: Headers;
  ip?: string;
}

/**
 * Audit log query options
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

/**
 * Audit Log Service class
 * 
 * Handles all audit logging operations with:
 * - Async fire-and-forget logging (non-blocking)
 * - Error resilience (logging failures don't break app)
 * - Structured metadata
 * - Query capabilities for audit reports
 */
class AuditLogService {
  /**
   * Log an audit event
   * 
   * This method is designed to be non-blocking and resilient.
   * Logging failures are captured but don't affect the main operation.
   * 
   * @param entry - Audit log entry details
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: entry.userId ?? undefined,
          action: entry.action,
          resourceType: entry.resourceType ?? undefined,
          resourceId: entry.resourceId ?? undefined,
          ipAddress: entry.ipAddress ?? undefined,
          userAgent: entry.userAgent ?? undefined,
          metadata: entry.metadata as object ?? undefined,
          success: entry.success ?? true,
          errorMessage: entry.errorMessage ?? undefined,
        },
      });

      // Also log to structured logger for immediate observability
      logger.info('Audit event', {
        action: entry.action,
        userId: entry.userId ?? undefined,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        success: entry.success ?? true,
      });
    } catch (error) {
      // Log error but don't throw - audit logging should never break the app
      logger.error('Failed to write audit log', {
        error: error instanceof Error ? error.message : 'Unknown error',
        entry,
      });
    }
  }

  /**
   * Log an audit event asynchronously (fire-and-forget)
   * 
   * Use this for non-critical audit events where you don't need to wait
   * for the log to be written.
   * 
   * @param entry - Audit log entry details
   */
  logAsync(entry: AuditLogEntry): void {
    // Fire and forget - don't await
    this.log(entry).catch(() => {
      // Silently ignore errors - already logged in the log method
    });
  }

  /**
   * Extract request context for audit logging
   * 
   * @param context - Request context with headers
   * @returns Extracted IP address and user agent
   */
  extractRequestContext(context: AuditRequestContext): {
    ipAddress?: string;
    userAgent?: string;
  } {
    const headers = context.headers;
    if (!headers) {
      return {};
    }

    // Get IP address from various headers (proxy-aware)
    const forwardedFor = headers.get('x-forwarded-for');
    const realIp = headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || context.ip;

    // Get user agent
    const userAgent = headers.get('user-agent') || undefined;

    return {
      ipAddress: ip ?? undefined,
      userAgent,
    };
  }

  /**
   * Query audit logs with filtering options
   * 
   * @param options - Query options for filtering
   * @returns Paginated audit log entries
   */
  async query(options: AuditLogQueryOptions = {}): Promise<{
    logs: Array<{
      id: string;
      userId: string | null;
      action: AuditAction;
      resourceType: string | null;
      resourceId: string | null;
      ipAddress: string | null;
      userAgent: string | null;
      metadata: unknown;
      success: boolean;
      errorMessage: string | null;
      timestamp: Date;
    }>;
    total: number;
    hasMore: boolean;
  }> {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      startDate,
      endDate,
      success,
      limit = 50,
      offset = 0,
    } = options;

    // Build where clause
    const where: {
      userId?: string;
      action?: AuditAction;
      resourceType?: string;
      resourceId?: string;
      success?: boolean;
      timestamp?: { gte?: Date; lte?: Date };
    } = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (resourceId) where.resourceId = resourceId;
    if (success !== undefined) where.success = success;
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    // Execute query with count
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      hasMore: offset + logs.length < total,
    };
  }

  /**
   * Get recent audit logs for a user
   * 
   * @param userId - User ID
   * @param limit - Number of logs to return
   * @returns Recent audit logs
   */
  async getRecentForUser(userId: string, limit = 10) {
    return this.query({
      userId,
      limit,
    });
  }

  /**
   * Get failed operations for monitoring
   * 
   * @param since - Start date for the query
   * @param limit - Number of logs to return
   * @returns Failed operation logs
   */
  async getFailedOperations(since: Date, limit = 100) {
    return this.query({
      success: false,
      startDate: since,
      limit,
    });
  }

  /**
   * Get authentication events for security monitoring
   * 
   * @param since - Start date for the query
   * @returns Authentication-related audit logs
   */
  async getAuthenticationEvents(since: Date) {
    const logs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: ['LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGE'],
        },
        timestamp: {
          gte: since,
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });

    return logs;
  }

  /**
   * Clean up old audit logs (for data retention policy)
   * 
   * @param retentionDays - Number of days to retain logs
   * @returns Number of deleted logs
   */
  async cleanup(retentionDays = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    logger.info('Audit log cleanup completed', {
      retentionDays,
      deletedCount: result.count,
    });

    return result.count;
  }
}

// Export singleton instance
export const auditLogService = new AuditLogService();

// Export convenience functions for common audit operations
export const auditLog = {
  /**
   * Log a successful operation
   */
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

  /**
   * Log a failed operation
   */
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

  /**
   * Log an authentication event
   */
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

  /**
   * Log a resource operation
   */
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

export default auditLogService;
