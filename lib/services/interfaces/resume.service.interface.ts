/**
 * Resume Service Interfaces
 * 
 * Following Interface Segregation Principle, the resume service
 * is split into focused interfaces for different concerns.
 */

import type { ServiceResult } from '@/lib/types/service-result';
import type {
  CoverLetterGenerationData,
  GeneratedResumeData,
  GenerateResumeServiceInput,
  GenerateResumeWithProgressInput,
} from '@/lib/services/resume-generation/types';
import type { ResumeDetails, ResumeListItem, UpdatedResumeData } from '@/lib/services/resume-crud/types';
import type { Resume } from '@/lib/validations/jsonresume';

/**
 * Resume Generation Service Interface
 * 
 * Handles AI-powered resume generation operations.
 * Follows Single Responsibility - only generation concerns.
 */
export interface IResumeGenerationService {
  /**
   * Generate a new resume using AI
   */
  generateResume(input: GenerateResumeServiceInput): Promise<ServiceResult<GeneratedResumeData>>;

  /**
   * Generate a resume with progress streaming
   */
  generateResumeWithProgress(input: GenerateResumeWithProgressInput): Promise<ServiceResult<GeneratedResumeData>>;

  /**
   * Generate a standalone cover letter
   */
  generateStandaloneCoverLetter(input: {
    userId: string;
    jobDescription: string;
    personalInstructions?: string;
    modelId?: string;
    profileId?: string;
  }): Promise<ServiceResult<CoverLetterGenerationData>>;
}

/**
 * Resume CRUD Service Interface
 * 
 * Handles resume persistence operations.
 * Follows Single Responsibility - only CRUD concerns.
 */
export interface IResumeCrudService {
  /**
   * List all resumes for a user
   */
  listResumes(userId: string): Promise<ServiceResult<ResumeListItem[]>>;

  /**
   * Get all resumes for a user (alias for listResumes)
   */
  getUserResumes(userId: string): Promise<ServiceResult<ResumeListItem[]>>;

  /**
   * Get a specific resume by ID
   */
  getResume(resumeId: string, userId: string): Promise<ServiceResult<ResumeDetails>>;

  /**
   * Delete a resume
   */
  deleteResume(resumeId: string, userId: string): Promise<ServiceResult<void>>;

  /**
   * Update resume content
   */
  updateResumeContent(
    resumeId: string,
    userId: string,
    resumeData: Resume
  ): Promise<ServiceResult<UpdatedResumeData>>;

  /**
   * Update resume template
   */
  updateResumeTemplate(
    resumeId: string,
    userId: string,
    templateId: string | null
  ): Promise<ServiceResult<UpdatedResumeData>>;

  /**
   * Update job-related fields for a resume
   */
  updateResumeJobDetails(
    resumeId: string,
    userId: string,
    input: {
      jobTitle?: string;
      companyName?: string;
      jobDescription?: string;
    }
  ): Promise<ServiceResult<UpdatedResumeData>>;
}

/**
 * Combined Resume Service Interface
 * 
 * For backward compatibility, combines both interfaces.
 */
export interface IResumeService extends IResumeGenerationService, IResumeCrudService {}
