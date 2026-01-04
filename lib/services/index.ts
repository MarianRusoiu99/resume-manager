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
  analyticsService,
  templateService,
  coverLetterService,
  apiProviderService,
  aiService,
  userAISettingsService,
  documentParserService,
  auditLogService,
  auditLog,
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
export { ResumeService } from './resumes';
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
} from './resumes';

export { ProfileService } from './profiles/profiles.service';
export type { Profile, ProfileList } from './profiles/types';

export { TemplateService } from './templates/templates.workflow';

export { CoverLetterService } from './cover-letters';

export { NotificationService } from './notifications/notifications.service';

export { AIService } from './ai';
export { ApiProviderService } from './api-providers/api-providers.workflow';
export type {
  AddApiProviderInput,
  UpdateApiProviderInput as ApiProviderUpdateInput,
  ProviderWithModels,
  ProviderInfo,
  ProviderListItem,
  ProviderInstanceData,
  AvailableModelsData,
  ValidationData,
} from './api-providers/types';

export { apiKeyAuditService } from './api-key-management';

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
