import { GeneratedResumeRepository, generatedResumeRepository } from '@/lib/repositories/generated-resumes.repository';
import { profileService as defaultProfileService } from '@/lib/services/profiles/profiles.service';
import { notificationService as defaultNotificationService } from '@/lib/services/notifications/notifications.service';
import { GenericUserOwnedCrudService } from '@/lib/services/utils/generic-crud.service';
import { withServiceError, NotFoundError } from '@/lib/services/utils';
import { logger } from '@/lib/utils/logger';
import type { Resume } from '@/lib/validations/jsonresume';
import type { 
  ServiceResult, 
  GenerateResumeInput as GenerateResumeServiceInput, 
  GenerateResumeWithProgressInput,
  ResumeDetails,
  ResumeListItem,
  UpdatedResumeData 
} from '@/lib/types';
import type { 
  CreateResumeInput, 
  GeneratedResumeEntity as RepoGeneratedResumeEntity, 
  UpdateResumeInput 
} from '@/lib/repositories/interfaces/generated-resumes.repository.interface';

import {
  runResumeGenerationWorkflow,
  runResumeGenerationWorkflowWithProgress,
} from './resume-generation.workflow';
import { invalidateUserResumesCache } from './crud-cache';
import { mapGeneratedResumeToDetails, mapGeneratedResumeToListItem } from './mappers';
import { resumeImportService } from './resume-import.service';

/**
 * Resume Service Interface
 * Handles both AI generation and CRUD operations for resumes.
 */
export interface IResumeService {
  // Generation
  generateResume(input: GenerateResumeServiceInput): Promise<ServiceResult<RepoGeneratedResumeEntity>>;
  generateResumeWithProgress(input: GenerateResumeWithProgressInput): Promise<ServiceResult<RepoGeneratedResumeEntity>>;
  generateStandaloneCoverLetter(input: {
    userId: string;
    jobDescription: string;
    personalInstructions?: string;
    modelId?: string;
    profileId?: string;
  }): Promise<ServiceResult<never>>;

  // CRUD
  create(data: CreateResumeInput): Promise<ServiceResult<RepoGeneratedResumeEntity>>;
  listResumes(userId: string): Promise<ServiceResult<ResumeListItem[]>>;
  getUserResumes(userId: string): Promise<ServiceResult<ResumeListItem[]>>;
  getResume(resumeId: string, userId: string): Promise<ServiceResult<ResumeDetails>>;
  deleteResume(resumeId: string, userId: string): Promise<ServiceResult<void>>;
  updateResumeContent(resumeId: string, userId: string, resumeData: Resume): Promise<ServiceResult<UpdatedResumeData>>;
  updateResumeTemplate(resumeId: string, userId: string, templateId: string | null): Promise<ServiceResult<UpdatedResumeData>>;
  updateResumeJobDetails(resumeId: string, userId: string, input: { jobTitle?: string; companyName?: string; jobDescription?: string }): Promise<ServiceResult<UpdatedResumeData>>;
  duplicateResume(resumeId: string, userId: string): Promise<ServiceResult<ResumeDetails>>;
  importResume(userId: string, formData: FormData): Promise<ServiceResult<{ resume: unknown }>>;
}

/**
 * Integrated Resume Service
 */
export class ResumeService 
  extends GenericUserOwnedCrudService<RepoGeneratedResumeEntity, CreateResumeInput, UpdateResumeInput, Record<string, unknown>, GeneratedResumeRepository>
  implements IResumeService 
{
  constructor(
    repository: GeneratedResumeRepository = generatedResumeRepository,
    private readonly profileService = defaultProfileService,
    private readonly notificationService = defaultNotificationService
  ) {
    super(repository, 'Resume');
  }

  // --- Generation Methods ---

  async generateResume(input: GenerateResumeServiceInput): Promise<ServiceResult<RepoGeneratedResumeEntity>> {
    return runResumeGenerationWorkflow(this.repository, this.profileService, this.notificationService, input);
  }

  async generateResumeWithProgress(input: GenerateResumeWithProgressInput): Promise<ServiceResult<RepoGeneratedResumeEntity>> {
    return runResumeGenerationWorkflowWithProgress(this.repository, this.profileService, this.notificationService, input);
  }

  async generateStandaloneCoverLetter(input: {
    userId: string;
    jobDescription: string;
    personalInstructions?: string;
    modelId?: string;
    profileId?: string;
  }): Promise<ServiceResult<never>> {
    return { success: false, error: 'Standalone cover letter generation not implemented in worker build context', code: 'INTERNAL_ERROR' };
  }

  async create(data: CreateResumeInput & { userId: string }): Promise<ServiceResult<RepoGeneratedResumeEntity>> {
    const result = await super.create(data);
    if (result.success) {
      const jobMetadata = (data.jobMetadata ?? {}) as Record<string, unknown>;
      // This is called in background, it emits to SSE hub which should work fine
      this.notificationService.notifyResumeGenerated(
        data.userId,
        result.data.id,
        jobMetadata?.jobTitle as string | undefined,
        jobMetadata?.companyName as string | undefined
      ).catch(err => logger.error('Failed to notify resume generated', { error: err }));
    }
    return result;
  }

  // --- CRUD Methods ---

  async listResumes(userId: string): Promise<ServiceResult<ResumeListItem[]>> {
    return withServiceError('list resumes', async () => {
      const resumes = await this.repository.findByUserId(userId);
      return resumes.map(mapGeneratedResumeToListItem);
    });
  }

  async getUserResumes(userId: string): Promise<ServiceResult<ResumeListItem[]>> {
    return this.listResumes(userId);
  }

  async getResume(resumeId: string, userId: string): Promise<ServiceResult<ResumeDetails>> {
    return withServiceError('get resume', async () => {
      const resume = await this.repository.findById(resumeId, userId);
      if (!resume) throw new NotFoundError('Resume');
      return mapGeneratedResumeToDetails(resume);
    });
  }

  async deleteResume(resumeId: string, userId: string): Promise<ServiceResult<void>> {
    return withServiceError('delete resume', async () => {
      const resume = await this.repository.findById(resumeId, userId);
      if (!resume) throw new NotFoundError('Resume');
      await this.repository.delete(resumeId, userId);
      invalidateUserResumesCache(userId);
    });
  }

  async updateResumeContent(
    resumeId: string,
    userId: string,
    resumeData: Resume
  ): Promise<ServiceResult<UpdatedResumeData>> {
    return withServiceError('update resume content', async () => {
      const updatedResume = await this.repository.update(resumeId, { resume: resumeData }, userId);
      invalidateUserResumesCache(userId);
      return {
        id: updatedResume.id,
        resume: updatedResume.resume as Resume,
        jobDescription: updatedResume.jobDescription,
        jobMetadata: updatedResume.jobMetadata as Record<string, unknown>,
        template: null,
        metadata: updatedResume.metadata as Record<string, unknown>,
        createdAt: updatedResume.createdAt,
        updatedAt: updatedResume.updatedAt,
      };
    });
  }

  async updateResumeTemplate(
    resumeId: string,
    userId: string,
    templateId: string | null
  ): Promise<ServiceResult<UpdatedResumeData>> {
    return withServiceError('update resume template', async () => {
      const existingResume = await this.repository.findById(resumeId, userId);
      if (!existingResume) throw new NotFoundError('Resume');

      const updatedResume = await this.repository.updateTemplate(resumeId, userId, templateId || undefined);
      invalidateUserResumesCache(userId);
      return {
        id: updatedResume.id,
        resume: updatedResume.resume as Resume,
        jobDescription: updatedResume.jobDescription,
        jobMetadata: updatedResume.jobMetadata as Record<string, unknown>,
        template: null,
        metadata: updatedResume.metadata as Record<string, unknown>,
        createdAt: updatedResume.createdAt,
        updatedAt: updatedResume.updatedAt,
      };
    });
  }

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
      if (!existingResume) throw new NotFoundError('Resume');

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
        resume: updatedResume.resume as Resume,
        jobDescription: updatedResume.jobDescription,
        jobMetadata: updatedResume.jobMetadata as Record<string, unknown>,
        template: null,
        metadata: updatedResume.metadata as Record<string, unknown>,
        createdAt: updatedResume.createdAt,
        updatedAt: updatedResume.updatedAt,
      };
    });
  }

  async duplicateResume(resumeId: string, userId: string): Promise<ServiceResult<ResumeDetails>> {
    return withServiceError('duplicate resume', async () => {
      const existingResume = await this.repository.findById(resumeId, userId);
      if (!existingResume) throw new NotFoundError('Resume');

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

      invalidateUserResumesCache(userId);
      return mapGeneratedResumeToDetails(duplicatedResume);
    });
  }

  async importResume(userId: string, formData: FormData): Promise<ServiceResult<{ resume: unknown }>> {
    return resumeImportService.importResume(userId, formData);
  }
}

export const resumeService = new ResumeService();
