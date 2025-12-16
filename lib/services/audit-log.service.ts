/**
 * Audit Log Service (Facade)
 *
 * This file preserves stable imports while the implementation lives under
 * `lib/services/audit-log/`.
 */

import { auditLogService } from './audit-log';

export {
  AuditLogService,
  auditLogService,
  auditLog,
} from './audit-log';

export type {
  AuditLogEntry,
  AuditLogQueryOptions,
  AuditRequestContext,
  AuditAction,
} from './audit-log';

export default auditLogService;
