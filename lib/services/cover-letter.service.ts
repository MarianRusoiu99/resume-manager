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

/**
 * Standard service result interface for business logic operations.
 */
interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

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
      return { success: true, data: coverLetter };
    } catch (error) {
      logger.error('[CoverLetterService] Create error', error, {
        operation: 'createCoverLetter',
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create cover letter',
      };
    }
  }

  async getCoverLetter(
    id: string,
    userId: string
  ): Promise<ServiceResult<CoverLetterWithResume>> {
    try {
      const coverLetter = await coverLetterRepository.findById(id, userId);

      if (!coverLetter) {
        return { success: false, error: 'Cover letter not found' };
      }

      return { success: true, data: coverLetter };
    } catch (error) {
      logger.error('[CoverLetterService] Get error', error, {
        operation: 'getCoverLetter',
        userId,
        coverLetterId: id,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch cover letter',
      };
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
      return { success: true, data: result };
    } catch (error) {
      logger.error('[CoverLetterService] List error', error, {
        operation: 'getUserCoverLetters',
        userId,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch cover letters',
      };
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
        return { success: false, error: 'Cover letter not found' };
      }

      const updated = await coverLetterRepository.update(id, userId, data);
      return { success: true, data: updated };
    } catch (error) {
      logger.error('[CoverLetterService] Update error', error, {
        operation: 'updateCoverLetter',
        userId,
        coverLetterId: id,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update cover letter',
      };
    }
  }

  async deleteCoverLetter(id: string, userId: string): Promise<ServiceResult<void>> {
    try {
      // Check if exists
      const exists = await coverLetterRepository.exists(id, userId);
      if (!exists) {
        return { success: false, error: 'Cover letter not found' };
      }

      await coverLetterRepository.delete(id, userId);
      return { success: true };
    } catch (error) {
      logger.error('[CoverLetterService] Delete error', error, {
        operation: 'deleteCoverLetter',
        userId,
        coverLetterId: id,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete cover letter',
      };
    }
  }
}

// Singleton instance
export const coverLetterService = new CoverLetterService();
