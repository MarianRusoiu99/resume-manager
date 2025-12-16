import { GeneratedResumeRepository, generatedResumeRepository } from '@/lib/repositories/generated-resume.repository';
import type { Resume } from '@/lib/validations/jsonresume';
import { type ServiceResult } from '@/lib/types/service-result';
import { withServiceError, NotFoundError } from '@/lib/services/utils';

import type { IResumeCrudService } from '../interfaces';
import { invalidateUserResumesCache } from './cache';
import { mapGeneratedResumeToDetails, mapGeneratedResumeToListItem } from './mappers';
import type { ResumeDetails, ResumeListItem, UpdatedResumeData } from './types';

/**
 * Service for resume CRUD operations
 * Single Responsibility: Handles database operations for resumes
 */
export class ResumeCrudService implements IResumeCrudService {
  constructor(
    private readonly repository: GeneratedResumeRepository = generatedResumeRepository
  ) {}

  /**
   * List all resumes for a user
   */
  async listResumes(userId: string): Promise<ServiceResult<ResumeListItem[]>> {
    return withServiceError('list resumes', async () => {
      const resumes = await this.repository.findByUserId(userId);
      return resumes.map(mapGeneratedResumeToListItem);
    });
  }

  /**
   * Alias for listResumes (for API backward compatibility)
   */
  async getUserResumes(userId: string): Promise<ServiceResult<ResumeListItem[]>> {
    return this.listResumes(userId);
  }

  /**
   * Get a specific resume by ID
   */
  async getResume(resumeId: string, userId: string): Promise<ServiceResult<ResumeDetails>> {
    return withServiceError('get resume', async () => {
      const resume = await this.repository.findByIdAndUserId(resumeId, userId);

      if (!resume) {
        throw new NotFoundError('Resume');
      }

      return mapGeneratedResumeToDetails(resume);
    });
  }

  /**
   * Delete a resume
   */
  async deleteResume(resumeId: string, userId: string): Promise<ServiceResult<void>> {
    return withServiceError('delete resume', async () => {
      const resume = await this.repository.findByIdAndUserId(resumeId, userId);

      if (!resume) {
        throw new NotFoundError('Resume');
      }

      await this.repository.delete(resumeId);

      // Invalidate cache after successful deletion
      invalidateUserResumesCache(userId);
    });
  }

  /**
   * Update Resume Content (for manual edits)
   */
  async updateResumeContent(
    resumeId: string,
    userId: string,
    resumeData: Resume
  ): Promise<ServiceResult<UpdatedResumeData>> {
    return withServiceError('update resume content', async () => {
      const existingResume = await this.repository.findByIdAndUserId(resumeId, userId);

      if (!existingResume) {
        throw new NotFoundError('Resume');
      }

      // Validation is intentionally skipped here because resume data is already validated via Zod schemas in the API route layer
      const validatedResume = resumeData;

      const updatedResume = await this.repository.update(resumeId, validatedResume);

      // Invalidate cache after successful update
      invalidateUserResumesCache(userId);

      return {
        id: updatedResume.id,
        resume: updatedResume.resume,
        jobDescription: updatedResume.jobDescription,
        jobMetadata: updatedResume.jobMetadata,
        template: null,
        metadata: updatedResume.metadata,
        createdAt: updatedResume.createdAt,
        updatedAt: updatedResume.updatedAt,
      };
    });
  }

  /**
   * Update Resume Template
   */
  async updateResumeTemplate(
    resumeId: string,
    userId: string,
    templateId: string | null
  ): Promise<ServiceResult<UpdatedResumeData>> {
    return withServiceError('update resume template', async () => {
      const existingResume = await this.repository.findByIdAndUserId(resumeId, userId);

      if (!existingResume) {
        throw new NotFoundError('Resume');
      }

      const updatedResume = await this.repository.updateTemplate(resumeId, templateId || undefined);

      // Invalidate cache after successful update
      invalidateUserResumesCache(userId);

      return {
        id: updatedResume.id,
        resume: updatedResume.resume,
        jobDescription: updatedResume.jobDescription,
        jobMetadata: updatedResume.jobMetadata,
        template: null,
        metadata: updatedResume.metadata,
        createdAt: updatedResume.createdAt,
        updatedAt: updatedResume.updatedAt,
      };
    });
  }
}

// Export singleton instance
export const resumeCrudService = new ResumeCrudService();
