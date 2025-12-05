/**
 * Service Layer Barrel Exports
 * 
 * All services follow the ServiceResult pattern for consistent error handling.
 * Import services from this file for cleaner imports.
 * 
 * @example
 * ```typescript
 * import { resumeService, profileService, templateService } from '@/lib/services';
 * ```
 */

export { resumeService, ResumeService } from './resume.service';
export type {
  GenerateResumeServiceInput,
  GenerateResumeWithProgressInput,
  ProgressCallback,
  ResumeData,
  GeneratedResumeData,
  CoverLetterGenerationData,
  ResumeListItem,
  ResumeDetails,
  UpdatedResumeData,
} from './resume.service';

export { profileService, ProfileService } from './profile.service';

export { templateService, TemplateService } from './template.service';

export { coverLetterService, CoverLetterService } from './cover-letter.service';

export { notificationService, NotificationService } from './notification.service';

export { apiProviderService } from './api-provider.service';
export type {
  AddApiProviderInput,
  UpdateApiProviderInput as ApiProviderUpdateInput,
  ProviderWithModels,
  ProviderInfo,
  ProviderListItem,
} from './api-provider.service';

export { apiKeyAuditService } from './api-key-audit.service';

export { auditLogService } from './audit-log.service';
