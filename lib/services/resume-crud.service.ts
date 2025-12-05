import { GeneratedResumeRepository, generatedResumeRepository } from '@/lib/repositories/generated-resume.repository';
import { resumesCache } from '@/lib/cache/resumes-cache';
import type { Resume } from '@/lib/validations/jsonresume';
import { logger } from '@/lib/utils/logger';
import { success, failure, type ServiceResult } from '@/lib/types/service-result';
import type { IResumeCrudService } from './interfaces';

/**
 * Resume list item
 */
export interface ResumeListItem {
  id: string;
  userId: string;
  jobTitle: string | null;
  companyName: string | null;
  jobDescription: string;
  content: Record<string, unknown>;
  templateId: string | null;
  metadata: {
    generatedAt: string;
    model: string;
    totalTokens: number;
    processingTime: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Detailed resume data
 */
export interface ResumeDetails {
  id: string;
  jobDescription: string;
  jobMetadata: Record<string, unknown>;
  jobTitle: string;
  companyName: string | null;
  content: Record<string, unknown>;
  metadata: {
    generatedAt: string;
    model: string;
    totalTokens: number;
    processingTime: number;
  };
  templateId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Updated resume data
 */
export interface UpdatedResumeData {
  id: string;
  resume: unknown;
  jobDescription: string;
  jobMetadata: unknown;
  template: unknown;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service for resume CRUD operations
 * Single Responsibility: Handles database operations for resumes
 */
export class ResumeCrudService implements IResumeCrudService {
  constructor(
    private readonly repository: GeneratedResumeRepository = generatedResumeRepository
  ) {}

  /**
   * Get cache key for user's resumes list
   */
  private getCacheKey(userId: string): string {
    return `resumes:${userId}`;
  }

  /**
   * Invalidate cache for a user's resumes
   */
  private invalidateCache(userId: string): void {
    resumesCache.delete(this.getCacheKey(userId));
  }

  /**
   * List all resumes for a user
   */
  async listResumes(userId: string): Promise<ServiceResult<ResumeListItem[]>> {
    try {
      const resumes = await this.repository.findByUserId(userId);

      const mapped = resumes.map(resume => {
        // Parse jobMetadata to extract jobTitle and companyName
        const jobMetadata = resume.jobMetadata as Record<string, unknown> | null;
        const jobTitle = (jobMetadata?.jobTitle as string) || null;
        const companyName = (jobMetadata?.companyName as string) || null;

        // Parse and normalize metadata to match frontend expectations
        const storedMetadata = resume.metadata as Record<string, unknown>;
        const normalizedMetadata = {
          generatedAt: (storedMetadata.generatedAt as string) || new Date().toISOString(),
          model: (storedMetadata.model as string) || 'unknown',
          totalTokens: (storedMetadata.totalTokens as number) || 0,
          processingTime: (storedMetadata.processingTime as number) || 0
        };

        return {
          id: resume.id,
          userId: resume.userId,
          jobTitle,
          companyName,
          jobDescription: resume.jobDescription,
          content: resume.resume as Record<string, unknown>,
          templateId: resume.templateId,
          metadata: normalizedMetadata,
          createdAt: resume.createdAt,
          updatedAt: resume.updatedAt
        };
      });

      return success(mapped);
    } catch (error) {
      logger.error('Error listing resumes', error);
      return failure('Failed to list resumes', 'INTERNAL_ERROR');
    }
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
    try {
      const resume = await this.repository.findByIdAndUserId(resumeId, userId);

      if (!resume) {
        return failure('Resume not found', 'NOT_FOUND');
      }

      // Parse jobMetadata to extract jobTitle and companyName
      const jobMetadata = resume.jobMetadata as Record<string, unknown> | null;
      const jobTitle = (jobMetadata?.jobTitle as string) || 'Position';
      const companyName = (jobMetadata?.companyName as string) || null;

      // Parse and normalize metadata to match frontend expectations
      const storedMetadata = resume.metadata as Record<string, unknown>;
      const normalizedMetadata = {
        generatedAt: (storedMetadata.generatedAt as string) || new Date().toISOString(),
        model: (storedMetadata.model as string) || 'unknown',
        totalTokens: (storedMetadata.tokens as number) || (storedMetadata.totalTokens as number) || 0,
        processingTime: (storedMetadata.processingTime as number) || 0
      };

      return success({
        id: resume.id,
        jobDescription: resume.jobDescription,
        jobMetadata: resume.jobMetadata as Record<string, unknown>,
        jobTitle,
        companyName,
        content: resume.resume as Record<string, unknown>,
        metadata: normalizedMetadata,
        templateId: resume.templateId,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt
      });
    } catch (error) {
      logger.error('Error getting resume', error);
      return failure('Failed to get resume', 'INTERNAL_ERROR');
    }
  }

  /**
   * Delete a resume
   */
  async deleteResume(resumeId: string, userId: string): Promise<ServiceResult<void>> {
    try {
      // Verify ownership
      const resume = await this.repository.findByIdAndUserId(resumeId, userId);

      if (!resume) {
        return failure('Resume not found or access denied', 'NOT_FOUND');
      }

      await this.repository.delete(resumeId);
      
      // Invalidate cache after successful deletion
      this.invalidateCache(userId);
      
      return success(undefined);
    } catch (error) {
      logger.error('Error deleting resume', error);
      return failure('Failed to delete resume', 'INTERNAL_ERROR');
    }
  }

  /**
   * Update Resume Content (for manual edits)
   * 
   * @param resumeId - Resume ID
   * @param userId - User ID (for ownership verification)
   * @param resumeData - Updated resume data (JSON Resume format)
   * @returns Updated resume or error
   */
  async updateResumeContent(resumeId: string, userId: string, resumeData: Resume): Promise<ServiceResult<UpdatedResumeData>> {
    try {
      // Verify ownership
      const existingResume = await this.repository.findByIdAndUserId(resumeId, userId);

      if (!existingResume) {
        return failure('Resume not found or access denied', 'NOT_FOUND');
      }

      // Validation is intentionally skipped here because resume data is already validated via Zod schemas in the API route layer
      const validatedResume = resumeData;

      // Update the resume using repository
      const updatedResume = await this.repository.update(resumeId, validatedResume);

      // Invalidate cache after successful update
      this.invalidateCache(userId);

      return success({
        id: updatedResume.id,
        resume: updatedResume.resume,
        jobDescription: updatedResume.jobDescription,
        jobMetadata: updatedResume.jobMetadata,
        template: null, // Template can be fetched separately if needed
        metadata: updatedResume.metadata,
        createdAt: updatedResume.createdAt,
        updatedAt: updatedResume.updatedAt,
      });
    } catch (error) {
      logger.error('Error updating resume content', error);
      return failure('Failed to update resume content', 'INTERNAL_ERROR');
    }
  }

  /**
   * Update Resume Template
   * 
   * @param resumeId - Resume ID
   * @param userId - User ID (for ownership verification)
   * @param templateId - Template ID to apply
   * @returns Updated resume or error
   */
  async updateResumeTemplate(resumeId: string, userId: string, templateId: string | null): Promise<ServiceResult<UpdatedResumeData>> {
    try {
      // Verify ownership
      const existingResume = await this.repository.findByIdAndUserId(resumeId, userId);

      if (!existingResume) {
        return failure('Resume not found or access denied', 'NOT_FOUND');
      }

      // Update the template using repository
      const updatedResume = await this.repository.updateTemplate(resumeId, templateId || undefined);

      // Invalidate cache after successful update
      this.invalidateCache(userId);

      return success({
        id: updatedResume.id,
        resume: updatedResume.resume,
        jobDescription: updatedResume.jobDescription,
        jobMetadata: updatedResume.jobMetadata,
        template: null, // Template can be fetched separately if needed
        metadata: updatedResume.metadata,
        createdAt: updatedResume.createdAt,
        updatedAt: updatedResume.updatedAt,
      });
    } catch (error) {
      logger.error('Error updating resume template', error);
      return failure('Failed to update resume template', 'INTERNAL_ERROR');
    }
  }
}

// Export singleton instance
export const resumeCrudService = new ResumeCrudService();
