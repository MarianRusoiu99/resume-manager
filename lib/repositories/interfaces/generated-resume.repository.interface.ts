/**
 * Generated Resume Repository Interface
 * 
 * Defines the contract for generated resume data access operations.
 */

import type { Resume } from '@/lib/validations/jsonresume';

/**
 * Generated resume data structure
 */
export interface GeneratedResumeData {
  id: string;
  userId: string;
  jobDescription: string;
  jobMetadata: unknown;
  resume: unknown;
  templateId: string | null;
  coverLetterId: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new generated resume
 */
export interface CreateResumeInput {
  userId: string;
  jobDescription: string;
  jobMetadata?: Record<string, unknown>;
  resume: Resume;
  templateId?: string;
  metadata: Record<string, unknown>;
}

/**
 * Generated Resume Repository Interface
 */
export interface IGeneratedResumeRepository {
  /**
   * Create a new generated resume
   */
  create(data: CreateResumeInput): Promise<GeneratedResumeData>;

  /**
   * Find all resumes for a user
   */
  findByUserId(userId: string): Promise<GeneratedResumeData[]>;

  /**
   * Find a resume by ID
   */
  findById(id: string): Promise<GeneratedResumeData | null>;

  /**
   * Find a resume by ID with user ownership check
   */
  findByIdAndUserId(id: string, userId: string): Promise<GeneratedResumeData | null>;

  /**
   * Update resume content
   */
  update(id: string, resume: Resume): Promise<GeneratedResumeData>;

  /**
   * Update template association
   */
  updateTemplate(id: string, templateId?: string): Promise<GeneratedResumeData>;

  /**
   * Link a cover letter to a resume
   */
  linkCoverLetter(resumeId: string, coverLetterId: string): Promise<GeneratedResumeData>;

  /**
   * Delete a resume
   */
  delete(id: string): Promise<void>;

  /**
   * Count resumes for a user
   */
  countByUserId(userId: string): Promise<number>;
}
