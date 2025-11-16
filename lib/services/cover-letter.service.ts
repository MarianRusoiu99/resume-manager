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

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

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
      console.error('[CoverLetterService] Create error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create cover letter',
      };
    }
  }

  /**
   * Get a specific cover letter by ID
   */
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
      console.error('[CoverLetterService] Get error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch cover letter',
      };
    }
  }

  /**
   * Get all cover letters for a user
   */
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
      console.error('[CoverLetterService] List error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch cover letters',
      };
    }
  }

  /**
   * Update a cover letter
   */
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
      console.error('[CoverLetterService] Update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update cover letter',
      };
    }
  }

  /**
   * Delete a cover letter
   */
  async deleteCoverLetter(
    id: string,
    userId: string
  ): Promise<ServiceResult<void>> {
    try {
      // Check if exists
      const exists = await coverLetterRepository.exists(id, userId);
      if (!exists) {
        return { success: false, error: 'Cover letter not found' };
      }

      await coverLetterRepository.delete(id, userId);
      return { success: true };
    } catch (error) {
      console.error('[CoverLetterService] Delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete cover letter',
      };
    }
  }
}

// Singleton instance
export const coverLetterService = new CoverLetterService();
