/**
 * Repository Interfaces
 * 
 * These interfaces define contracts for data access layer operations.
 * Implementing classes must fulfill these contracts, enabling:
 * - Dependency Inversion (depend on abstractions, not concretions)
 * - Easy unit testing with mock implementations
 * - Swappable data sources (e.g., Prisma → another ORM)
 */

export type { IProfileRepository, ProfileData, CreateProfileInput, UpdateProfileInput } from './profile.repository.interface';
export type { IGeneratedResumeRepository, CreateResumeInput } from './generated-resume.repository.interface';
export type { INotificationRepository, CreateNotificationInput as NotificationCreateInput } from './notification.repository.interface';
export type { ITemplateRepository, CreateTemplateInput, UpdateTemplateInput } from './template.repository.interface';
export type { ICoverLetterRepository } from './cover-letter.repository.interface';
export type { ICache } from './cache.interface';
