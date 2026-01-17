import { GeneratedResumeRepository, generatedResumeRepository } from '@/lib/repositories/generated-resumes.repository';
import type { Resume } from '@/lib/validations/jsonresume';
import { type ServiceResult } from '@/lib/types';
import { withServiceError, NotFoundError } from '@/lib/services/utils';

import type { IResumeCrudService } from '@/lib/services/interfaces';
import { invalidateUserResumesCache } from './cache';
import { mapGeneratedResumeToDetails, mapGeneratedResumeToListItem } from './mappers';
import type { ResumeDetails, ResumeListItem, UpdatedResumeData } from '@/lib/types';

import { GenericUserOwnedCrudService } from '@/lib/services/utils/generic-crud.service';
import type { CreateResumeInput, GeneratedResumeData, UpdateResumeInput } from '@/lib/repositories/interfaces/generated-resumes.repository.interface';
import { resumeImportService } from './resume-import.service';

/**
 * Service for resume CRUD operations
 * Single Responsibility: Handles database operations for resumes
 */
export class ResumeCrudService 
  extends GenericUserOwnedCrudService<GeneratedResumeData, CreateResumeInput, UpdateResumeInput, Record<string, unknown>, GeneratedResumeRepository>
  implements IResumeCrudService 
{
  constructor(
    repository: GeneratedResumeRepository = generatedResumeRepository
  ) {
    super(repository, 'Resume');
  }

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
      const resume = await this.repository.findById(resumeId, userId);

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
      const resume = await this.repository.findById(resumeId, userId);

      if (!resume) {
        throw new NotFoundError('Resume');
      }

      await this.repository.delete(resumeId, userId);

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
      const updatedResume = await this.repository.update(resumeId, { resume: resumeData }, userId);

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

  /**
   * Update job metadata (job title/company name/job description)
   */
  async updateResumeJobDetails(
    resumeId: string,
    userId: string,
    input: {
      jobTitle?: string;
      companyName?: string;
      jobDescription?: string;
    }
  ): Promise<ServiceResult<UpdatedResumeData>> {
    return withServiceError('update resume job details', async () => {
      const existingResume = await this.repository.findById(resumeId, userId);

      if (!existingResume) {
        throw new NotFoundError('Resume');
      }

      const existingJobMetadata = (existingResume.jobMetadata ?? {}) as Record<string, unknown>;

      const updatedJobMetadata: Record<string, unknown> = {
        ...existingJobMetadata,
        ...(input.jobTitle === undefined ? {} : { jobTitle: input.jobTitle }),
        ...(input.companyName === undefined ? {} : { companyName: input.companyName }),
      };

      const updatedResume = await this.repository.updateJobDetails(resumeId, {
        ...(input.jobDescription === undefined ? {} : { jobDescription: input.jobDescription }),
        jobMetadata: updatedJobMetadata,
      });

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
   * Duplicate a resume
   */
  async duplicateResume(resumeId: string, userId: string): Promise<ServiceResult<ResumeDetails>> {
    return withServiceError('duplicate resume', async () => {
      const existingResume = await this.repository.findById(resumeId, userId);
      if (!existingResume) {
        throw new NotFoundError('Resume');
      }

      const duplicatedResume = await this.repository.create({
        userId,
        resume: existingResume.resume as Resume,
        jobDescription: existingResume.jobDescription || '',
        jobMetadata: {
          ...(existingResume.jobMetadata as Record<string, unknown>),
          jobTitle: `${(existingResume.jobMetadata as Record<string, unknown>)?.jobTitle || 'Resume'} (Copy)`,
        },
        templateId: existingResume.templateId || undefined,
        metadata: (existingResume.metadata as Record<string, unknown>) || {},
      });

      // Invalidate cache
      invalidateUserResumesCache(userId);

      return mapGeneratedResumeToDetails(duplicatedResume);
    });
  }

  /**
   * Import a resume from a file
   */
  async importResume(userId: string, formData: FormData): Promise<ServiceResult<{ resume: unknown }>> {
    return resumeImportService.importResume(userId, formData);
  }
}

// Export singleton instance
export const resumeCrudService = new ResumeCrudService();
