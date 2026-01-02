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
   * Find a resume by ID with optional user ownership check
   */
  findById(id: string, userId?: string): Promise<GeneratedResumeData | null>;

  /**
   * Find all resumes for a user
   */
  findAllForUser(userId: string, args?: any): Promise<GeneratedResumeData[]>;

  /**
   * Update a resume
   */
  update(id: string, data: any, userId?: string): Promise<GeneratedResumeData>;

  /**
   * Delete a resume
   */
  delete(id: string, userId?: string): Promise<GeneratedResumeData>;

  /**
   * Check if resume exists and belongs to user
   */
  exists(id: string, userId?: string): Promise<boolean>;


  /**
   * Count resumes for a user
   */
  countByUserId(userId: string): Promise<number>;

  /**
   * Update resume template
   */
  updateTemplate(id: string, templateId?: string): Promise<GeneratedResumeData>;

  /**
   * Update job details
   */
  updateJobDetails(
    id: string,
    data: { jobDescription?: string; jobMetadata?: Record<string, unknown> }
  ): Promise<GeneratedResumeData>;

  /**
   * Link a cover letter to a resume
   */
  linkCoverLetter(id: string, coverLetterId: string | null): Promise<GeneratedResumeData>;
}
