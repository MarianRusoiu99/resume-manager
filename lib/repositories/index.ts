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
} from './base.repository';

export {
  GenericRepository,
  GenericUserOwnedRepository,
  type EntityWithId,
  type UserOwnedEntity,
} from './generic.repository';

export { 
  profileRepository, 
  ProfileRepository 
} from './profile.repository';

export { 
  generatedResumeRepository, 
  GeneratedResumeRepository 
} from './generated-resume.repository';

export { 
  templateRepository, 
  TemplateRepository 
} from './template.repository';

export { 
  coverLetterRepository, 
  CoverLetterRepository 
} from './cover-letter.repository';
export type {
  CreateCoverLetterInput,
  UpdateCoverLetterInput,
} from './interfaces';

export { 
  notificationRepository, 
  NotificationRepository 
} from './notification.repository';

export { 
  apiProviderRepository,
  ApiProviderRepository,
} from './api-provider.repository';

export {
  userRepository,
  UserRepository,
} from './user.repository';
export type {
  CreateUserInput,
  UpdateUserInput,
} from './user.repository';

export {
  userAISettingsRepository,
  UserAISettingsRepository,
} from './user-ai-settings.repository';
export type {
  AIFeatureType,
  ModelPreference,
  UserAISettingsData,
  UpsertAISettingsInput,
} from './interfaces';
