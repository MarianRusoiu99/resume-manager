import {
  CoverLetterRepository,
  coverLetterRepository,
} from '@/lib/repositories/cover-letters.repository';
import type { CreateCoverLetterInput, UpdateCoverLetterInput, CoverLetterData, FindCoverLettersOptions } from '@/lib/repositories/interfaces/cover-letters.repository.interface';
import { type ServiceResult } from '@/lib/types';
import { withServiceError, GenericUserOwnedCrudService } from '@/lib/services/utils';
import { notificationService as defaultNotificationService, type INotificationService } from '@/lib/services/notifications/notifications.service';

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
  createCoverLetter(input: CreateCoverLetterInput): Promise<ServiceResult<CoverLetterListItem>>;
  getCoverLetter(id: string, userId: string): Promise<ServiceResult<CoverLetterWithResume>>;
  getUserCoverLetters(userId: string, options?: FindCoverLettersOptions): Promise<ServiceResult<{ coverLetters: CoverLetterListItem[]; total: number }>>;
  updateCoverLetter(id: string, userId: string, data: UpdateCoverLetterInput): Promise<ServiceResult<CoverLetterListItem>>;
  deleteCoverLetter(id: string, userId: string): Promise<ServiceResult<void>>;
}

export class CoverLetterService 
  extends GenericUserOwnedCrudService<CoverLetterData, CreateCoverLetterInput, UpdateCoverLetterInput, Record<string, unknown>, CoverLetterRepository>
  implements ICoverLetterService 
{
  constructor(
    repository: CoverLetterRepository = coverLetterRepository,
    private readonly notificationService: INotificationService = defaultNotificationService
  ) {
    super(repository, 'CoverLetter');
  }

  async createCoverLetter(
    input: CreateCoverLetterInput
  ): Promise<ServiceResult<CoverLetterData>> {
    const result = await this.create(input);
    if (result.success) {
      const metadata = input.metadata as Record<string, any>;
      await this.notificationService.notifyCoverLetterGenerated(
        input.userId,
        result.data.id,
        metadata?.jobTitle,
        metadata?.companyName
      );
    }
    return result;
  }

  async getCoverLetter(
    id: string,
    userId: string
  ): Promise<ServiceResult<CoverLetterData>> {
    return this.getById(id, userId);
  }

  async getUserCoverLetters(
    userId: string,
    options?: FindCoverLettersOptions
  ): Promise<ServiceResult<{ coverLetters: CoverLetterData[]; total: number }>> {
    return withServiceError('fetch cover letters', async () => {
      return await this.repository.findAllForUserWithCount(userId, options);
    });
  }

  async updateCoverLetter(
    id: string,
    userId: string,
    data: UpdateCoverLetterInput
  ): Promise<ServiceResult<CoverLetterData>> {
    return this.update(id, userId, data);
  }

  async deleteCoverLetter(id: string, userId: string): Promise<ServiceResult<void>> {
    return this.delete(id, userId);
  }
}

export const coverLetterService = new CoverLetterService();
