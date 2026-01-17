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

// Re-export types from centralized location
export type {
  GenerateResumeInput as GenerateResumeServiceInput,
  ProgressCallback,
  GenerateResumeWithProgressInput,
  ResumeData,
  GeneratedResumeData,
  CoverLetterGenerationData,
  ResumeListItem,
  ResumeDetails,
  UpdatedResumeData,
} from '@/lib/types';

// Import services
import { ResumeGenerationService, resumeGenerationService } from './generation';
import { ResumeCrudService, resumeCrudService } from './crud';
import type { IResumeService } from '../interfaces';
import type { ServiceResult } from '@/lib/types';
import type { Resume } from '@/lib/validations/jsonresume';
import type {
  GenerateResumeInput as GenerateResumeServiceInput,
  GenerateResumeWithProgressInput,
  GeneratedResumeData,
  CoverLetterGenerationData,
  ResumeListItem,
  ResumeDetails,
  UpdatedResumeData,
} from '@/lib/types';

import type { CreateResumeInput, GeneratedResumeData as RepoGeneratedResumeData } from '@/lib/repositories/interfaces/generated-resumes.repository.interface';

/**
 * Resume Service - Composes generation and CRUD services
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
  create(data: CreateResumeInput): Promise<ServiceResult<RepoGeneratedResumeData>> {
    return this.crudService.create(data);
  }
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

  duplicateResume(resumeId: string, userId: string): Promise<ServiceResult<ResumeDetails>> {
    return this.crudService.duplicateResume(resumeId, userId);
  }

  importResume(userId: string, formData: FormData): Promise<ServiceResult<{ resume: unknown }>> {
    return this.crudService.importResume(userId, formData);
  }
}

// Export singleton instance for backward compatibility
// Note: This singleton might not have all dependencies injected correctly if used outside ServiceContainer
export const resumeService = new ResumeService();

// Also re-export individual services for direct use
export { ResumeGenerationService, resumeGenerationService } from './generation';
export { ResumeCrudService, resumeCrudService } from './crud';
