/**
 * API Key Audit Service (Facade)
 *
 * This file preserves stable imports while the implementation lives under
 * `lib/services/api-key-audit/`.
 */

export { ApiKeyAuditService, apiKeyAuditService } from './api-key-audit';

export type { AuditContext, AuditMetadata, ApiKeyAuditAction } from './api-key-audit';
