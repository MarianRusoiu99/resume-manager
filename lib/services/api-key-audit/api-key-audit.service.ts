import { prisma } from '@/lib/db';
import { logger } from '@/lib/utils/logger';

import type { ApiKeyAuditAction } from '@prisma/client';

import type { AuditContext, AuditMetadata } from './types';

export class ApiKeyAuditService {
  /**
   * Log an API key audit event.
   */
  async log(
    providerId: string,
    action: ApiKeyAuditAction,
    context: AuditContext,
    options: {
      metadata?: AuditMetadata;
      success?: boolean;
      errorMessage?: string;
    } = {}
  ): Promise<void> {
    const { metadata, success = true, errorMessage } = options;

    try {
      await prisma.apiKeyAuditLog.create({
        data: {
          providerId,
          action,
          userId: context.userId,
          ipAddress: context.ipAddress || null,
          userAgent: context.userAgent ? context.userAgent.substring(0, 500) : null,
          metadata: (metadata as object) ?? undefined,
          success,
          errorMessage: errorMessage || null,
        },
      });

      logger.info(`API Key Audit: ${action}`, {
        providerId,
        userId: context.userId,
        success,
        action,
      });
    } catch (error) {
      logger.error('Failed to create API key audit log', {
        error,
        providerId,
        action,
        userId: context.userId,
      });
    }
  }

  async logKeyCreated(
    providerId: string,
    context: AuditContext,
    metadata?: { provider?: string; name?: string }
  ): Promise<void> {
    await this.log(providerId, 'KEY_CREATED', context, { metadata });
  }

  async logKeyRotated(
    providerId: string,
    context: AuditContext,
    metadata?: { reason?: string; keyVersion?: number }
  ): Promise<void> {
    await this.log(providerId, 'KEY_ROTATED', context, { metadata });
  }

  async logKeyRevoked(
    providerId: string,
    context: AuditContext,
    metadata?: { reason?: string }
  ): Promise<void> {
    await this.log(providerId, 'KEY_REVOKED', context, { metadata });
  }

  async logKeyDeleted(
    providerId: string,
    context: AuditContext,
    metadata?: { reason?: string }
  ): Promise<void> {
    await this.log(providerId, 'KEY_DELETED', context, { metadata });
  }

  async logKeyDecrypted(
    providerId: string,
    context: AuditContext,
    metadata?: { endpoint?: string; purpose?: string }
  ): Promise<void> {
    await this.log(providerId, 'KEY_DECRYPTED', context, { metadata });
  }

  async logKeyValidated(
    providerId: string,
    context: AuditContext,
    success: boolean,
    metadata?: { modelsCount?: number; errorMessage?: string }
  ): Promise<void> {
    await this.log(providerId, 'KEY_VALIDATED', context, {
      metadata,
      success,
      errorMessage: metadata?.errorMessage,
    });
  }

  async logKeyUsed(
    providerId: string,
    context: AuditContext,
    metadata: {
      endpoint: string;
      modelUsed?: string;
      tokensConsumed?: number;
      success?: boolean;
      errorMessage?: string;
    }
  ): Promise<void> {
    await this.log(providerId, 'KEY_USED', context, {
      metadata,
      success: metadata.success ?? true,
      errorMessage: metadata.errorMessage,
    });

    try {
      await prisma.apiProvider.update({
        where: { id: providerId },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
          lastUsedIp: context.ipAddress || undefined,
        },
      });
    } catch (error) {
      logger.error('Failed to update provider usage count', { error, providerId });
    }
  }

  async logScopeChanged(
    providerId: string,
    context: AuditContext,
    metadata: { previousScopes: string[]; newScopes: string[]; reason?: string }
  ): Promise<void> {
    await this.log(providerId, 'KEY_SCOPE_CHANGED', context, { metadata });
  }

  async getProviderAuditLogs(
    providerId: string,
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ) {
    const { limit = 50, offset = 0 } = options;

    return prisma.apiKeyAuditLog.findMany({
      where: {
        providerId,
        provider: { userId },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getUserAuditLogs(
    userId: string,
    options: { limit?: number; offset?: number; action?: ApiKeyAuditAction } = {}
  ) {
    const { limit = 100, offset = 0, action } = options;

    return prisma.apiKeyAuditLog.findMany({
      where: {
        userId,
        ...(action ? { action } : {}),
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            provider: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getSuspiciousActivity(userId: string, options: { hoursBack?: number } = {}) {
    const { hoursBack = 24 } = options;
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    return prisma.apiKeyAuditLog.findMany({
      where: {
        userId,
        timestamp: { gte: since },
        success: false,
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            provider: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }
}

export const apiKeyAuditService = new ApiKeyAuditService();
