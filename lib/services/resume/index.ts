/**
 * Resume Service - Facade for backward compatibility
 *
 * This module composes generation + CRUD services and re-exports the
 * public types for consumers still importing from `lib/services/resume.service`.
 *
 * Prefer importing directly from:
 * - `lib/services/resume-generation`
 * - `lib/services/resume-crud`
 */

// Re-export types from generation service
export type {
  GenerateResumeServiceInput,
  ProgressCallback,
  GenerateResumeWithProgressInput,
  ResumeData,
  GeneratedResumeData,
  CoverLetterGenerationData,
} from './generation';

// Re-export types from CRUD service
export type { ResumeListItem, ResumeDetails, UpdatedResumeData } from './crud';

// Import services
import { ResumeGenerationService, resumeGenerationService } from './generation';
import { ResumeCrudService, resumeCrudService } from './crud';
import type { IResumeService } from '../interfaces';
import type { ServiceResult } from '@/lib/types/service-result';
import type { Resume } from '@/lib/validations/jsonresume';
import type {
  GenerateResumeServiceInput,
  GenerateResumeWithProgressInput,
  GeneratedResumeData,
  CoverLetterGenerationData,
} from './generation';
import type { ResumeListItem, ResumeDetails, UpdatedResumeData } from './crud';

/**
 * Unified Resume Service - Composes generation and CRUD services
 *
 * Implements IResumeService interface for backward compatibility.
 * Delegates to specialized services following the Facade pattern.
 */
export class ResumeService implements IResumeService {
  constructor(
    private readonly generationService: ResumeGenerationService = resumeGenerationService,
    private readonly crudService: ResumeCrudService = resumeCrudService
  ) {}

  // Generation methods - delegate to ResumeGenerationService
  generateResume(input: GenerateResumeServiceInput): Promise<ServiceResult<GeneratedResumeData>> {
    return this.generationService.generateResume(input);
  }

  generateResumeWithProgress(
    input: GenerateResumeWithProgressInput
  ): Promise<ServiceResult<GeneratedResumeData>> {
    return this.generationService.generateResumeWithProgress(input);
  }

  generateStandaloneCoverLetter(input: {
    userId: string;
    jobDescription: string;
    personalInstructions?: string;
    modelId?: string;
    profileId?: string;
  }): Promise<ServiceResult<CoverLetterGenerationData>> {
    return this.generationService.generateStandaloneCoverLetter(input);
  }

  // CRUD methods - delegate to ResumeCrudService
  listResumes(userId: string): Promise<ServiceResult<ResumeListItem[]>> {
    return this.crudService.listResumes(userId);
  }

  getUserResumes(userId: string): Promise<ServiceResult<ResumeListItem[]>> {
    return this.crudService.getUserResumes(userId);
  }

  getResume(resumeId: string, userId: string): Promise<ServiceResult<ResumeDetails>> {
    return this.crudService.getResume(resumeId, userId);
  }

  deleteResume(resumeId: string, userId: string): Promise<ServiceResult<void>> {
    return this.crudService.deleteResume(resumeId, userId);
  }

  updateResumeContent(
    resumeId: string,
    userId: string,
    resumeData: Resume
  ): Promise<ServiceResult<UpdatedResumeData>> {
    return this.crudService.updateResumeContent(resumeId, userId, resumeData);
  }

  updateResumeTemplate(
    resumeId: string,
    userId: string,
    templateId: string | null
  ): Promise<ServiceResult<UpdatedResumeData>> {
    return this.crudService.updateResumeTemplate(resumeId, userId, templateId);
  }

  updateResumeJobDetails(
    resumeId: string,
    userId: string,
    input: { jobTitle?: string; companyName?: string; jobDescription?: string }
  ): Promise<ServiceResult<UpdatedResumeData>> {
    return this.crudService.updateResumeJobDetails(resumeId, userId, input);
  }
}

// Export singleton instance for backward compatibility
export const resumeService = new ResumeService();

// Also re-export individual services for direct use
export { ResumeGenerationService, resumeGenerationService } from './generation';
export { ResumeCrudService, resumeCrudService } from './crud';
