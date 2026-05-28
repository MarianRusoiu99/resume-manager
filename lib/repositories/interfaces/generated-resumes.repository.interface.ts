/**
 * Generated Resume Repository Interface
 * 
 * Defines the contract for generated resume data access operations.
 */

import type { Resume } from '@/lib/validations/jsonresume';
import type { PrismaArgs } from '../generic.repository';
import { TransactionClient } from '@/lib/db/transaction';

/**
 * Generated resume entity (database representation)
 */
export interface GeneratedResumeEntity {
  id: string;
  userId: string;
  jobDescription: string;
  jobMetadata: Record<string, unknown>;
  resume: Resume | null;
  templateId: string | null;
  coverLetterId: string | null;
  metadata: Record<string, unknown>;
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
 * Input for updating a generated resume
 */
export interface UpdateResumeInput {
  resume?: Resume;
  templateId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Generated Resume Repository Interface
 */
export interface IGeneratedResumeRepository {
  /**
   * Create a new generated resume
   */
  create(data: CreateResumeInput, tx?: TransactionClient): Promise<GeneratedResumeEntity>;

  /**
   * Find all resumes for a user
   */
  findByUserId(userId: string, tx?: TransactionClient): Promise<GeneratedResumeEntity[]>;

  /**
   * Find a resume by ID with optional user ownership check
   */
  findById(id: string, userId?: string, tx?: TransactionClient): Promise<GeneratedResumeEntity | null>;

  /**
   * Find all resumes for a user
   */
  findAllForUser(userId: string, args?: PrismaArgs, tx?: TransactionClient): Promise<GeneratedResumeEntity[]>;

  /**
   * Update a resume
   */
  update(id: string, data: UpdateResumeInput, userId?: string, tx?: TransactionClient): Promise<GeneratedResumeEntity>;

  /**
   * Delete a resume
   */
  delete(id: string, userId?: string, tx?: TransactionClient): Promise<GeneratedResumeEntity>;

  /**
   * Check if resume exists and belongs to user
   */
  exists(id: string, userId?: string, tx?: TransactionClient): Promise<boolean>;


  /**
   * Count resumes for a user
   */
  countByUserId(userId: string, tx?: TransactionClient): Promise<number>;

  /**
   * Update resume template
   */
  updateTemplate(id: string, userId: string, templateId?: string, tx?: TransactionClient): Promise<GeneratedResumeEntity>;

  /**
   * Update job details
   */
  updateJobDetails(
    id: string,
    data: { jobDescription?: string; jobMetadata?: Record<string, unknown> },
    tx?: TransactionClient
  ): Promise<GeneratedResumeEntity>;

  /**
   * Link a cover letter to a resume
   */
  linkCoverLetter(id: string, coverLetterId: string | null, tx?: TransactionClient): Promise<GeneratedResumeEntity>;
}

/**
 * @deprecated Use GeneratedResumeEntity instead. This alias will be removed in a future version.
 */
export type GeneratedResumeData = GeneratedResumeEntity;
