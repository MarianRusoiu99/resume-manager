/**
 * Cover Letter Service
 *
 * Business logic for managing cover letters
 */

import {
  coverLetterRepository,
  CreateCoverLetterInput,
  UpdateCoverLetterInput,
} from '@/lib/repositories/cover-letter.repository';
import type { CoverLetterWithResume, CoverLetterListItem } from '@/lib/types/cover-letter';
import { logger } from '@/lib/utils/logger';
import { success, failure, type ServiceResult } from '@/lib/types/service-result';

/**
 * Service for managing cover letters, including creation, retrieval, updating, and deletion.
 * All methods return a ServiceResult indicating success, data, or error.
 */
export class CoverLetterService {
  /**
   * Create a new cover letter
   */
  async createCoverLetter(
    input: CreateCoverLetterInput
  ): Promise<ServiceResult<CoverLetterListItem>> {
    try {
      const coverLetter = await coverLetterRepository.create(input);
      return success(coverLetter);
    } catch (error) {
      logger.error('[CoverLetterService] Create error', error, {
        operation: 'createCoverLetter',
      });
      return failure(
        error instanceof Error ? error.message : 'Failed to create cover letter',
        'INTERNAL_ERROR'
      );
    }
  }

  async getCoverLetter(
    id: string,
    userId: string
  ): Promise<ServiceResult<CoverLetterWithResume>> {
    try {
      const coverLetter = await coverLetterRepository.findById(id, userId);

      if (!coverLetter) {
        return failure('Cover letter not found', 'NOT_FOUND');
      }

      return success(coverLetter);
    } catch (error) {
      logger.error('[CoverLetterService] Get error', error, {
        operation: 'getCoverLetter',
        userId,
        coverLetterId: id,
      });
      return failure(
        error instanceof Error ? error.message : 'Failed to fetch cover letter',
        'INTERNAL_ERROR'
      );
    }
  }

  async getUserCoverLetters(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: 'createdAt' | 'updatedAt';
      orderDir?: 'asc' | 'desc';
    }
  ): Promise<ServiceResult<{ coverLetters: CoverLetterListItem[]; total: number }>> {
    try {
      const result = await coverLetterRepository.findByUserId(userId, options);
      return success(result);
    } catch (error) {
      logger.error('[CoverLetterService] List error', error, {
        operation: 'getUserCoverLetters',
        userId,
      });
      return failure(
        error instanceof Error ? error.message : 'Failed to fetch cover letters',
        'INTERNAL_ERROR'
      );
    }
  }

  async updateCoverLetter(
    id: string,
    userId: string,
    data: UpdateCoverLetterInput
  ): Promise<ServiceResult<CoverLetterListItem>> {
    try {
      // Check if exists
      const exists = await coverLetterRepository.exists(id, userId);
      if (!exists) {
        return failure('Cover letter not found', 'NOT_FOUND');
      }

      const updated = await coverLetterRepository.update(id, userId, data);
      return success(updated);
    } catch (error) {
      logger.error('[CoverLetterService] Update error', error, {
        operation: 'updateCoverLetter',
        userId,
        coverLetterId: id,
      });
      return failure(
        error instanceof Error ? error.message : 'Failed to update cover letter',
        'INTERNAL_ERROR'
      );
    }
  }

  async deleteCoverLetter(id: string, userId: string): Promise<ServiceResult<void>> {
    try {
      // Check if exists
      const exists = await coverLetterRepository.exists(id, userId);
      if (!exists) {
        return failure('Cover letter not found', 'NOT_FOUND');
      }

      await coverLetterRepository.delete(id, userId);
      return success(undefined as void);
    } catch (error) {
      logger.error('[CoverLetterService] Delete error', error, {
        operation: 'deleteCoverLetter',
        userId,
        coverLetterId: id,
      });
      return failure(
        error instanceof Error ? error.message : 'Failed to delete cover letter',
        'INTERNAL_ERROR'
      );
    }
  }
}

// Singleton instance
export const coverLetterService = new CoverLetterService();
