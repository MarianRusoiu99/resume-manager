/**
 * Service Interfaces
 * 
 * These interfaces define contracts for business logic layer operations.
 * Implementing classes must fulfill these contracts, enabling:
 * - Liskov Substitution Principle (interchangeable implementations)
 * - Easy unit testing with mock services
 * - Clear API boundaries between layers
 */

export type { IProfileService, ProfileServiceData, UpdateProfileServiceInput } from '@/lib/services/profiles/profiles.service';
export type { IResumeService } from '@/lib/services/resumes/resume.service';
export type { INotificationService, NotificationServiceData } from '@/lib/services/notifications/notifications.service';
export type { ITemplateService, CreateTemplateServiceInput, UpdateTemplateServiceInput } from '@/lib/services/templates/templates.workflow';
export type { ICoverLetterService, CoverLetterListItem, CoverLetterWithResume } from '@/lib/services/cover-letters/cover-letters.service';
export type { IAIService, EnhanceTextInput, EnhanceTextResult, OptimizeResumeInput, OptimizeResumeResult, GenerateCoverLetterInput, GenerateCoverLetterResult } from '@/lib/services/ai/ai.service';
export type { IDocumentParserService } from '@/lib/services/document-parser/document-parser.service';
