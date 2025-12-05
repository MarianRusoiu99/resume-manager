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
} from './cover-letter.repository';

export { 
  notificationRepository, 
  NotificationRepository 
} from './notification.repository';
export type {
  CreateNotificationInput,
} from './notification.repository';

export { 
  apiProviderRepository,
} from './api-provider.repository';
export type {
  CreateApiProviderInput as CreateApiProviderRepositoryInput,
  UpdateApiProviderInput as UpdateApiProviderRepositoryInput,
} from './api-provider.repository';

export {
  userRepository,
  UserRepository,
} from './user.repository';
export type {
  CreateUserInput,
  UpdateUserInput,
} from './user.repository';
