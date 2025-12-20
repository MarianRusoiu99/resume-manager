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

// Service container for dependency injection
export { 
  ServiceContainer, 
  serviceContainer,
  profileService,
  resumeService,
  resumeGenerationService,
  resumeCrudService,
  notificationService,
  templateService,
  coverLetterService,
  apiProviderService,
  aiService,
  userAISettingsService,
} from './container';

// Service interfaces for dependency injection and testing
export type {
  IProfileService,
  IResumeService,
  IResumeGenerationService,
  IResumeCrudService,
  INotificationService,
  ITemplateService,
  ICoverLetterService,
  IAIService,
} from './interfaces';

// Resume services (facade + split services)
export { ResumeService } from './resume.service';
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

export { ProfileService } from './profile.service';
export type { Profile, ProfileList } from './profile';

export { TemplateService } from './template.service';

export { CoverLetterService } from './cover-letter.service';

export { NotificationService } from './notification.service';

export { AIService } from './ai.service';
export { ApiProviderService } from './api-provider.service';
export type {
  AddApiProviderInput,
  UpdateApiProviderInput as ApiProviderUpdateInput,
  ProviderWithModels,
  ProviderInfo,
  ProviderListItem,
  ProviderInstanceData,
  AvailableModelsData,
  ValidationData,
} from './api-provider.service';

export { apiKeyAuditService } from './api-key-audit.service';

export { auditLogService } from './audit-log.service';



// Service utilities for reducing boilerplate
export {
  withServiceError,
  withServiceErrorSync,
  ServiceOperationError,
  ServiceErrors,
  isServiceOperationError,
  runParallel,
  chainOperations,
} from './utils';
