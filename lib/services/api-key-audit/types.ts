import type { ApiKeyAuditAction } from '@prisma/client';

export interface AuditContext {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditMetadata {
  endpoint?: string;
  modelUsed?: string;
  tokensConsumed?: number;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  [key: string]: unknown;
}

export type { ApiKeyAuditAction };
