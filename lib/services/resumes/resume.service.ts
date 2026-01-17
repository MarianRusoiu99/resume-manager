import { GeneratedResumeRepository, generatedResumeRepository } from '@/lib/repositories/generated-resumes.repository';
import { profileService as defaultProfileService } from '@/lib/services/profiles/profiles.service';
import { notificationService as defaultNotificationService } from '@/lib/services/notifications/notifications.service';
import { GenericUserOwnedCrudService } from '@/lib/services/utils/generic-crud.service';
import { withServiceError, NotFoundError } from '@/lib/services/utils';
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
  GeneratedResumeData as RepoGeneratedResumeData, 
  UpdateResumeInput 
} from '@/lib/repositories/interfaces/generated-resumes.repository.interface';

import {
  runResumeGenerationWorkflow,
  runResumeGenerationWorkflowWithProgress,
  runStandaloneCoverLetterWorkflow,
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
  generateResume(input: GenerateResumeServiceInput): Promise<ServiceResult<RepoGeneratedResumeData>>;
  generateResumeWithProgress(input: GenerateResumeWithProgressInput): Promise<ServiceResult<RepoGeneratedResumeData>>;
  generateStandaloneCoverLetter(input: {
    userId: string;
    jobDescription: string;
    personalInstructions?: string;
    modelId?: string;
    profileId?: string;
  }): Promise<ServiceResult<any>>;

  // CRUD
  create(data: CreateResumeInput): Promise<ServiceResult<RepoGeneratedResumeData>>;
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
  extends GenericUserOwnedCrudService<RepoGeneratedResumeData, CreateResumeInput, UpdateResumeInput, Record<string, unknown>, GeneratedResumeRepository>
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

  async generateResume(input: GenerateResumeServiceInput): Promise<ServiceResult<RepoGeneratedResumeData>> {
    const result = await runResumeGenerationWorkflow(this.repository, this.profileService, this.notificationService, input);
    if (!result.success) return result;
    
    const resume = await this.repository.findById(result.data.resumeId, input.userId);
    if (!resume) throw new Error('Generated resume not found');
    return { success: true, data: resume };
  }

  async generateResumeWithProgress(input: GenerateResumeWithProgressInput): Promise<ServiceResult<RepoGeneratedResumeData>> {
    const result = await runResumeGenerationWorkflowWithProgress(this.repository, this.profileService, this.notificationService, input);
    if (!result.success) return result;

    const resume = await this.repository.findById(result.data.resumeId, input.userId);
    if (!resume) throw new Error('Generated resume not found');
    return { success: true, data: resume };
  }

  async generateStandaloneCoverLetter(input: {
    userId: string;
    jobDescription: string;
    personalInstructions?: string;
    modelId?: string;
    profileId?: string;
  }) {
    return runStandaloneCoverLetterWorkflow(input);
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
        resume: updatedResume.resume as any,
        jobDescription: updatedResume.jobDescription,
        jobMetadata: updatedResume.jobMetadata as any,
        template: null,
        metadata: updatedResume.metadata as any,
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
      const updatedResume = await this.repository.updateTemplate(resumeId, templateId || undefined);
      invalidateUserResumesCache(userId);
      return {
        id: updatedResume.id,
        resume: updatedResume.resume as any,
        jobDescription: updatedResume.jobDescription,
        jobMetadata: updatedResume.jobMetadata as any,
        template: null,
        metadata: updatedResume.metadata as any,
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
        resume: updatedResume.resume as any,
        jobDescription: updatedResume.jobDescription,
        jobMetadata: updatedResume.jobMetadata as any,
        template: null,
        metadata: updatedResume.metadata as any,
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
