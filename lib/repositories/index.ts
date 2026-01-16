/**
 * Repository Layer Barrel Exports
 * 
 * Repositories provide data access abstraction over Prisma.
 * Import repositories from this file for cleaner imports.
 * 
 * @example
 * ```typescript
 * import { 
 *   profileRepository, 
 *   generatedResumeRepository,
 *   templateRepository 
 * } from '@/lib/repositories';
 * ```
 */

// Interfaces for dependency injection and testing
export type {
  IProfileRepository,
  ProfileData,
  CreateProfileInput,
  UpdateProfileInput as ProfileUpdateInput,
} from './interfaces';
export type { IGeneratedResumeRepository } from './interfaces';
export type { ITemplateRepository } from './interfaces';
export type { ICoverLetterRepository } from './interfaces';
export type { INotificationRepository } from './interfaces';
export type { ICache } from './interfaces';

// Base repository classes and utilities
export {
  createPaginatedResult,
  type PaginatedResult,
  GenericRepository,
  GenericUserOwnedRepository,
  type EntityWithId,
  type UserOwnedEntity,
} from './generic.repository';

export { 
  profileRepository, 
  ProfileRepository 
} from './profiles.repository';

export { 
  generatedResumeRepository, 
  GeneratedResumeRepository 
} from './generated-resumes.repository';

export { 
  templateRepository, 
  TemplateRepository 
} from './templates.repository';

export { 
  coverLetterRepository, 
  CoverLetterRepository 
} from './cover-letters.repository';
export type {
  CreateCoverLetterInput,
  UpdateCoverLetterInput,
} from './interfaces';

export { 
  notificationRepository, 
  NotificationRepository 
} from './notifications.repository';

export { 
  apiProviderRepository,
  ApiProviderRepository,
} from './api-providers.repository';

export {
  userRepository,
  UserRepository,
} from './users.repository';
export type {
  CreateUserInput,
  UpdateUserInput,
} from './interfaces';

export {
  userAISettingsRepository,
  UserAISettingsRepository,
} from './ai-settings.repository';
export type {
  AIFeatureType,
  ModelPreference,
  UserAISettingsData,
  UpsertAISettingsInput,
} from './interfaces';
