/**
 * Cover Letter Service Interface
 * 
 * Defines the contract for cover letter business logic operations.
 * 
 * Note: Uses Prisma types for compatibility with the data layer.
 */

import type { ServiceResult } from '@/lib/types/service-result';
import type { CoverLetter } from '@prisma/client';
import type { 
  CreateCoverLetterInput,
  UpdateCoverLetterInput 
} from '@/lib/repositories/cover-letter.repository';

/**
 * Cover letter list item for display - uses Prisma's CoverLetter type
 */
export type CoverLetterListItem = CoverLetter;

/**
 * Cover letter with optional related resume
 */
export interface CoverLetterWithResume extends CoverLetter {
  generatedResume?: {
    id: string;
    jobDescription: string;
  } | null;
}

/**
 * Options for fetching cover letters
 */
export interface GetCoverLettersOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt';
  orderDir?: 'asc' | 'desc';
}

/**
 * Cover Letter Service Interface
 */
export interface ICoverLetterService {
  /**
   * Create a new cover letter
   */
  createCoverLetter(
    input: CreateCoverLetterInput
  ): Promise<ServiceResult<CoverLetterListItem>>;

  /**
   * Get a cover letter by ID
   */
  getCoverLetter(
    id: string,
    userId: string
  ): Promise<ServiceResult<CoverLetterWithResume>>;

  /**
   * Get all cover letters for a user
   */
  getUserCoverLetters(
    userId: string,
    options?: GetCoverLettersOptions
  ): Promise<ServiceResult<{ coverLetters: CoverLetterListItem[]; total: number }>>;

  /**
   * Update a cover letter
   */
  updateCoverLetter(
    id: string,
    userId: string,
    data: UpdateCoverLetterInput
  ): Promise<ServiceResult<CoverLetterListItem>>;

  /**
   * Delete a cover letter
   */
  deleteCoverLetter(id: string, userId: string): Promise<ServiceResult<void>>;
}
