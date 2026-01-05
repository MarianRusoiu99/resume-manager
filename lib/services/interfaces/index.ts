/**
 * Service Interfaces
 * 
 * These interfaces define contracts for business logic layer operations.
 * Implementing classes must fulfill these contracts, enabling:
 * - Liskov Substitution Principle (interchangeable implementations)
 * - Easy unit testing with mock services
 * - Clear API boundaries between layers
 */

export type { IProfileService, ProfileServiceData, UpdateProfileServiceInput } from './profiles.service.interface';
export type { IResumeGenerationService, IResumeCrudService, IResumeService } from './resumes.service.interface';
export type { INotificationService } from './notifications.service.interface';
export type { ITemplateService } from './templates.service.interface';
export type { ICoverLetterService } from './cover-letters.service.interface';
export type { IAIService } from './ai.service.interface';
