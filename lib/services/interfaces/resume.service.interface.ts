/**
 * Resume Service Interfaces
 * 
 * Following Interface Segregation Principle, the resume service
 * is split into focused interfaces for different concerns.
 */

import type { Resume } from '@/lib/validations/jsonresume';
import type { ServiceResult } from '@/lib/types/service-result';

/**
 * Resume data returned from generation
 */
export interface ResumeData {
  id: string;
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Result of resume generation
 */
export interface GeneratedResumeData {
  resumeId: string;
  resume: ResumeData;
}

/**
 * Resume list item for display
 */
export interface ResumeListItem {
  id: string;
  userId: string;
  jobTitle: string | null;
  companyName: string | null;
  jobDescription: string;
  content: Record<string, unknown>;
  templateId: string | null;
  metadata: {
    generatedAt: string;
    model: string;
    totalTokens: number;
    processingTime: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Detailed resume data
 */
export interface ResumeDetails {
  id: string;
  jobDescription: string;
  jobMetadata: Record<string, unknown>;
  jobTitle: string;
  companyName: string | null;
  content: Record<string, unknown>;
  metadata: {
    generatedAt: string;
    model: string;
    totalTokens: number;
    processingTime: number;
  };
  templateId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Updated resume data after edits
 */
export interface UpdatedResumeData {
  id: string;
  resume: unknown;
  jobDescription: string;
  jobMetadata: unknown;
  template: unknown;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for resume generation
 */
export interface GenerateResumeInput {
  userId: string;
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  templateId?: string;
  modelId?: string;
  profileId?: string;
}

/**
 * Progress callback type
 */
export type ProgressCallback = (step: string, message: string, progress: number) => void;

/**
 * Input for resume generation with progress
 */
export interface GenerateResumeWithProgressInput extends GenerateResumeInput {
  onProgress: ProgressCallback;
}

/**
 * Cover letter generation result
 */
export interface CoverLetterGenerationData {
  coverLetterId: string;
  coverLetter: string;
  metadata: {
    jobTitle: string;
    companyName: string;
    tokensUsed: number;
  };
}

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
  generateResume(input: GenerateResumeInput): Promise<ServiceResult<GeneratedResumeData>>;

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
}

/**
 * Combined Resume Service Interface
 * 
 * For backward compatibility, combines both interfaces.
 */
export interface IResumeService extends IResumeGenerationService, IResumeCrudService {}
