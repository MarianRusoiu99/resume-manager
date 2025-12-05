/**
 * Resume Service - Facade for backward compatibility
 * 
 * This module re-exports from the split services for existing imports.
 * New code should import from the specific services directly:
 * - resume-generation.service.ts for AI generation
 * - resume-crud.service.ts for CRUD operations
 */

// Re-export types from generation service
export type {
  GenerateResumeServiceInput,
  ProgressCallback,
  GenerateResumeWithProgressInput,
  ResumeData,
  GeneratedResumeData,
  CoverLetterGenerationData,
} from './resume-generation.service';

// Re-export types from CRUD service
export type {
  ResumeListItem,
  ResumeDetails,
  UpdatedResumeData,
} from './resume-crud.service';

// Import services
import { ResumeGenerationService, resumeGenerationService } from './resume-generation.service';
import { ResumeCrudService, resumeCrudService } from './resume-crud.service';
import type { IResumeService } from './interfaces';
import type { ServiceResult } from '@/lib/types/service-result';
import type { Resume } from '@/lib/validations/jsonresume';
import type { 
  GenerateResumeServiceInput, 
  GenerateResumeWithProgressInput,
  GeneratedResumeData,
  CoverLetterGenerationData 
} from './resume-generation.service';
import type { ResumeListItem, ResumeDetails, UpdatedResumeData } from './resume-crud.service';

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

  generateResumeWithProgress(input: GenerateResumeWithProgressInput): Promise<ServiceResult<GeneratedResumeData>> {
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

  updateResumeContent(resumeId: string, userId: string, resumeData: Resume): Promise<ServiceResult<UpdatedResumeData>> {
    return this.crudService.updateResumeContent(resumeId, userId, resumeData);
  }

  updateResumeTemplate(resumeId: string, userId: string, templateId: string | null): Promise<ServiceResult<UpdatedResumeData>> {
    return this.crudService.updateResumeTemplate(resumeId, userId, templateId);
  }
}

// Export singleton instance for backward compatibility
export const resumeService = new ResumeService();

// Also re-export individual services for direct use
export { ResumeGenerationService, resumeGenerationService } from './resume-generation.service';
export { ResumeCrudService, resumeCrudService } from './resume-crud.service';
