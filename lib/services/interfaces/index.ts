/**
 * Service Interfaces
 * 
 * These interfaces define contracts for business logic layer operations.
 * Implementing classes must fulfill these contracts, enabling:
 * - Liskov Substitution Principle (interchangeable implementations)
 * - Easy unit testing with mock services
 * - Clear API boundaries between layers
 */

export type { IProfileService } from './profile.service.interface';
export type { IResumeGenerationService, IResumeCrudService, IResumeService } from './resume.service.interface';
export type { INotificationService } from './notification.service.interface';
export type { ITemplateService } from './template.service.interface';
export type { ICoverLetterService } from './cover-letter.service.interface';
