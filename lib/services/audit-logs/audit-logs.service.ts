import { prisma } from '@/lib/db/index';
import { logger } from '@/lib/utils';

import type { AuditAction } from '@prisma/client';

import type { AuditLogEntry, AuditLogQueryOptions, AuditRequestContext } from './types';

/**
 * Audit Log Service class.
 *
 * Handles all audit logging operations with:
 * - Async fire-and-forget logging (non-blocking)
 * - Error resilience (logging failures don't break app)
 * - Structured metadata
 * - Query capabilities for audit reports
 */
export class AuditLogService {
  /**
   * Log an audit event.
   *
   * This method is designed to be non-blocking and resilient.
   * Logging failures are captured but don't affect the main operation.
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
          metadata: (entry.metadata as object) ?? undefined,
          success: entry.success ?? true,
          errorMessage: entry.errorMessage ?? undefined,
        },
      });

      logger.info('Audit event', {
        action: entry.action,
        userId: entry.userId ?? undefined,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        success: entry.success ?? true,
      });
    } catch (error) {
      logger.error('Failed to write audit log', error, { entry });
    }
  }

  /**
   * Log an audit event asynchronously (fire-and-forget).
   * Errors are logged but don't propagate to caller.
   */
  logAsync(entry: AuditLogEntry): void {
    this.log(entry).catch((error) => {
      logger.error('Async audit log failed', error, { action: entry.action });
    });
  }

  /**
   * Extract request context for audit logging.
   */
  extractRequestContext(context: AuditRequestContext): {
    ipAddress?: string;
    userAgent?: string;
  } {
    const headers = context.headers;
    if (!headers) {
      return {};
    }

    const forwardedFor = headers.get('x-forwarded-for');
    const realIp = headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || context.ip;

    const userAgent = headers.get('user-agent') || undefined;

    return {
      ipAddress: ip ?? undefined,
      userAgent,
    };
  }

  /**
   * Query audit logs with filtering options.
   */
  async query(
    options: AuditLogQueryOptions = {}
  ): Promise<{
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
   * Get recent audit logs for a user.
   */
  async getRecentForUser(userId: string, limit = 10) {
    return this.query({
      userId,
      limit,
    });
  }

  /**
   * Get failed operations for monitoring.
   */
  async getFailedOperations(since: Date, limit = 100) {
    return this.query({
      success: false,
      startDate: since,
      limit,
    });
  }

  /**
   * Get authentication events for security monitoring.
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
   * Clean up old audit logs (for data retention policy).
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

export const auditLogService = new AuditLogService();
