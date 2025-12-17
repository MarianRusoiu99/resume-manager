/**
 * Cover Letter Service
 *
 * Business logic for managing cover letters.
 * Implements ICoverLetterService with constructor injection.
 */

import {
  CoverLetterRepository,
  coverLetterRepository,
  CreateCoverLetterInput,
  UpdateCoverLetterInput,
} from '@/lib/repositories/cover-letter.repository';
import type { CoverLetterWithResume, CoverLetterListItem } from '@/lib/types/cover-letter';
import { type ServiceResult } from '@/lib/types/service-result';
import { withServiceError, BaseCrudService } from '@/lib/services/utils';
import type { ICoverLetterService } from './interfaces';

/**
 * Service for managing cover letters, including creation, retrieval, updating, and deletion.
 * All methods return a ServiceResult indicating success, data, or error.
 */
export class CoverLetterService extends BaseCrudService implements ICoverLetterService {
  constructor(private readonly repository: CoverLetterRepository = coverLetterRepository) {
    super();
  }

  /**
   * Create a new cover letter
   */
  async createCoverLetter(
    input: CreateCoverLetterInput
  ): Promise<ServiceResult<CoverLetterListItem>> {
    return withServiceError('create cover letter', async () => {
      return await this.repository.create(input);
    });
  }

  async getCoverLetter(
    id: string,
    userId: string
  ): Promise<ServiceResult<CoverLetterWithResume>> {
    return withServiceError('fetch cover letter', async () => {
      return await this.requireFound(this.repository.findById(id, userId), 'Cover letter');
    });
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
    return withServiceError('fetch cover letters', async () => {
      return await this.repository.findByUserId(userId, options);
    });
  }

  async updateCoverLetter(
    id: string,
    userId: string,
    data: UpdateCoverLetterInput
  ): Promise<ServiceResult<CoverLetterListItem>> {
    return withServiceError('update cover letter', async () => {
      await this.requireExists(this.repository.exists(id, userId), 'Cover letter');
      return await this.repository.update(id, userId, data);
    });
  }

  async deleteCoverLetter(id: string, userId: string): Promise<ServiceResult<void>> {
    return withServiceError('delete cover letter', async () => {
      await this.requireExists(this.repository.exists(id, userId), 'Cover letter');
      await this.repository.delete(id, userId);
    });
  }
}

// Singleton instance
export const coverLetterService = new CoverLetterService();
