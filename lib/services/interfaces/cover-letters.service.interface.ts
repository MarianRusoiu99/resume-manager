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
  UpdateCoverLetterInput,
  CoverLetterData,
  FindCoverLettersOptions as GetCoverLettersOptions
} from '@/lib/repositories/interfaces/cover-letters.repository.interface';

/**
 * Cover letter list item for display
 */
export type CoverLetterListItem = CoverLetterData;

/**
 * Cover letter with optional related resume/job.
 */
export type CoverLetterWithResume = CoverLetterData;

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
