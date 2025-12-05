import { GeneratedResumeRepository, generatedResumeRepository } from '@/lib/repositories/generated-resume.repository';
import { generateResume } from '@/lib/ai';
import { profileService } from '@/lib/services/profile.service';
import { resumesCache } from '@/lib/cache/resumes-cache';
import type { Resume } from '@/lib/validations/jsonresume';
import { resumeSchema } from '@/lib/validations/jsonresume';
import { logger } from '@/lib/utils/logger';
import { success, failure, type ServiceResult } from '@/lib/types/service-result';
import type { IResumeGenerationService } from './interfaces';

/**
 * Input parameters for resume generation
 */
export interface GenerateResumeServiceInput {
  /** User ID who is generating the resume */
  userId: string;
  /** Job description text to analyze */
  jobDescription: string;
  /** Optional job title */
  jobTitle?: string;
  /** Optional company name */
  companyName?: string;
  /** Optional template ID to apply */
  templateId?: string;
  /** Optional AI model ID to use for generation */
  modelId?: string;
  /** Optional profile ID to use (defaults to user's default profile) */
  profileId?: string;
}

/**
 * Progress callback for streaming updates
 */
export type ProgressCallback = (step: string, message: string, progress: number) => void;

/**
 * Input parameters for resume generation with progress streaming
 */
export interface GenerateResumeWithProgressInput extends GenerateResumeServiceInput {
  /** Progress callback for real-time updates */
  onProgress: ProgressCallback;
}

/**
 * Resume data returned from service operations
 */
export interface ResumeData {
  id: string;
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Result of resume generation operation
 */
export interface GeneratedResumeData {
  resumeId: string;
  resume: ResumeData;
}

/**
 * Cover letter generation result
 */
export interface CoverLetterGenerationData {
  coverLetterId: string;
  coverLetter: string;
  metadata: {
    jobTitle: string;
    companyName: string;
    tokensUsed: number;
  };
}

/**
 * Service for resume generation using AI
 * Single Responsibility: Orchestrates AI-powered resume generation workflow
 */
export class ResumeGenerationService implements IResumeGenerationService {
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
   * Fetch and validate user's resume from profile
   * Supports both default profile and specific profile ID
   */
  private async fetchAndValidateUserResume(
    userId: string,
    profileId?: string,
    skipValidation = false
  ): Promise<ServiceResult<Resume>> {
    // Use profileId if provided, otherwise get default profile
    const profileResult = profileId
      ? await profileService.getProfileById(profileId, userId)
      : await profileService.getProfile(userId);

    if (!profileResult.success || !profileResult.data) {
      return failure('User profile not found. Please complete your profile before generating a resume.', 'NOT_FOUND');
    }

    const profileData = profileResult.data;
    if (!profileData || typeof profileData !== 'object' || !('resume' in profileData)) {
      return failure('Profile structure is invalid. Please update your profile.', 'VALIDATION_ERROR');
    }
    if (!profileData.resume) {
      return failure('Profile does not contain resume data. Please complete your profile.', 'VALIDATION_ERROR');
    }

    // Skip validation for streaming (validation happens elsewhere) or validate with Zod
    if (skipValidation) {
      return success(profileData.resume as Resume);
    }

    try {
      const userResume = resumeSchema.parse(profileData.resume);
      return success(userResume);
    } catch (error) {
      logger.error('Profile resume validation failed', error);
      return failure('Invalid profile data format. Please update your profile.', 'VALIDATION_ERROR');
    }
  }

  /**
   * Resolve AI provider and model for generation
   */
  private async resolveProvider(
    userId: string,
    modelId?: string
  ): Promise<ServiceResult<{ provider: import('@/lib/ai/providers').AIProvider; modelId: string; providerType: string }>> {
    const { apiProviderService } = await import('@/lib/services/api-provider.service');
    
    try {
      const modelsResult = await apiProviderService.getAvailableModels(userId);
      if (!modelsResult.success || modelsResult.data.allModels.length === 0) {
        return failure('No AI provider configured. Please add an API key in Settings → API Keys', 'NOT_FOUND');
      }

      // Find specific model or use first available
      const targetModel = modelId
        ? modelsResult.data.allModels.find(m => m.id === modelId)
        : modelsResult.data.allModels[0];

      if (!targetModel) {
        return failure(`Model ${modelId} not found in your configured providers`, 'NOT_FOUND');
      }

      const providerResult = await apiProviderService.getProviderInstance(targetModel.providerId, userId);
      if (!providerResult.success) {
        return failure(providerResult.error || 'Failed to get AI provider configuration', 'INTERNAL_ERROR');
      }

      return success({
        provider: providerResult.data.provider,
        modelId: targetModel.id,
        providerType: providerResult.data.providerType
      });
    } catch (error) {
      return failure(error instanceof Error ? error.message : 'Failed to get AI provider', 'INTERNAL_ERROR');
    }
  }

  /**
   * Save generated resume to database
   */
  private async saveGeneratedResume(
    input: GenerateResumeServiceInput,
    validatedResume: Resume,
    workflowResult: { tokensUsed?: number },
    extractedJobTitle: string,
    extractedCompanyName: string
  ) {
    return await this.repository.create({
      userId: input.userId,
      jobDescription: input.jobDescription,
      jobMetadata: {
        jobTitle: extractedJobTitle,
        companyName: extractedCompanyName
      },
      templateId: input.templateId ?? undefined,
      resume: validatedResume,
      metadata: {
        model: validatedResume.meta?.model || 'unknown',
        totalTokens: workflowResult.tokensUsed || 0,
        generatedAt: validatedResume.meta?.lastModified || new Date().toISOString()
      }
    });
  }

  /**
   * Build success response from generated resume
   */
  private buildGeneratedResumeResponse(generatedResume: {
    id: string;
    resume: unknown;
    metadata: unknown;
    createdAt: Date;
  }): GeneratedResumeData {
    return {
      resumeId: generatedResume.id,
      resume: {
        id: generatedResume.id,
        content: generatedResume.resume as Record<string, unknown>,
        metadata: generatedResume.metadata as Record<string, unknown>,
        createdAt: generatedResume.createdAt
      }
    };
  }

  /**
   * Generate a new resume using AI workflow
   * 
   * @param input - Generation parameters
   * @returns Generated resume with database ID
   */
  async generateResume(input: GenerateResumeServiceInput): Promise<ServiceResult<GeneratedResumeData>> {
    try {
      // Validate user profile and resume
      const resumeResult = await this.fetchAndValidateUserResume(input.userId, input.profileId);
      if (!resumeResult.success) {
        return failure(resumeResult.error, 'VALIDATION_ERROR');
      }
      const userResume = resumeResult.data;

      logger.info('Starting resume generation', {
        userId: input.userId,
        jobTitle: input.jobTitle || 'Not specified',
        companyName: input.companyName || 'Not specified',
        modelId: input.modelId || 'auto-selected'
      });

      // Resolve provider
      const providerResult = await this.resolveProvider(input.userId, input.modelId);
      if (!providerResult.success) {
        return failure(providerResult.error, 'INTERNAL_ERROR');
      }
      const provider = providerResult.data.provider;
      const modelId = providerResult.data.modelId;

      // Call workflow service with provider instance
      const workflowResult = await generateResume({
        provider,
        modelId,
        jobDescription: input.jobDescription,
        userResume,
        userId: input.userId
      });

      if (!workflowResult.success || !workflowResult.resume) {
        logger.error('Resume generation workflow failed');
        return failure(workflowResult.error || 'Failed to generate resume', 'INTERNAL_ERROR');
      }

      logger.info('Workflow completed successfully', {
        tokensUsed: workflowResult.tokensUsed || 0,
      });

      // Extract job title and company from workflow result
      const extractedJobTitle = workflowResult.jobTitle || input.jobTitle || 'Position';
      const extractedCompanyName = workflowResult.companyName || input.companyName || 'Company';
      logger.debug('Resume title extracted', { jobTitle: extractedJobTitle, companyName: extractedCompanyName });

      // Validate generated resume
      const validatedResume = resumeSchema.parse(workflowResult.resume);

      // Store in database
      const generatedResume = await this.saveGeneratedResume(input, validatedResume, workflowResult, extractedJobTitle, extractedCompanyName);
      logger.info('Resume saved to database', { resumeId: generatedResume.id });

      // Invalidate cache after generating new resume
      this.invalidateCache(input.userId);

      return success(this.buildGeneratedResumeResponse(generatedResume));
    } catch (error) {
      logger.error('Resume generation error', error);
      return failure(error instanceof Error ? error.message : 'Unknown error occurred', 'INTERNAL_ERROR');
    }
  }

  /**
   * Generate a new resume with progress streaming
   * 
   * @param input - Generation parameters including progress callback
   * @returns Generated resume with database ID
   */
  async generateResumeWithProgress(input: GenerateResumeWithProgressInput): Promise<ServiceResult<GeneratedResumeData>> {
    const { onProgress, ...baseInput } = input;

    const scheduleProgressUpdates = (startTime: number) => {
      onProgress('job-analysis', 'Analyzing job description...', 20);

      setTimeout(() => {
        if (Date.now() - startTime < 30000) onProgress('profile-matching', 'Matching your profile to job requirements...', 40);
      }, 3000);

      setTimeout(() => {
        if (Date.now() - startTime < 30000) onProgress('content-optimization', 'Optimizing resume content...', 60);
      }, 8000);

      setTimeout(() => {
        if (Date.now() - startTime < 30000) onProgress('format-validation', 'Validating ATS compatibility...', 75);
      }, 13000);

      setTimeout(() => {
        if (Date.now() - startTime < 30000) onProgress('output-generation', 'Generating final resume...', 85);
      }, 18000);
    };

    try {
      onProgress('init', 'Initializing resume generation...', 0);

      // Fetch and validate profile using shared method (skip validation for streaming)
      onProgress('profile', 'Fetching your profile data...', 5);
      const profileResult = await this.fetchAndValidateUserResume(
        baseInput.userId,
        baseInput.profileId,
        true // skipValidation - validation happens at workflow level
      );
      if (!profileResult.success) {
        return failure(profileResult.error, profileResult.code);
      }

      onProgress('profile', 'Profile loaded successfully', 10);
      const userResume = profileResult.data;

      // Debug: Log profile summary to verify it has real data
      logger.debug('Profile summary', {
        name: userResume.basics?.name || 'Not set',
        email: userResume.basics?.email || 'Not set',
        workExperience: userResume.work?.length || 0,
        education: userResume.education?.length || 0,
        skills: userResume.skills?.length || 0
      });

      logger.info('Starting resume generation with progress', { userId: baseInput.userId });

      logger.debug('Job details', {
        jobTitle: baseInput.jobTitle || 'Not specified',
        companyName: baseInput.companyName || 'Not specified'
      });

      onProgress('workflow', 'Starting AI workflow...', 15);

      const startTime = Date.now();
      scheduleProgressUpdates(startTime);

      // Resolve provider using shared method
      const providerResult = await this.resolveProvider(baseInput.userId, baseInput.modelId);
      if (!providerResult.success) {
        return failure(providerResult.error, providerResult.code);
      }

      const provider = providerResult.data.provider;
      const modelId = providerResult.data.modelId;
      logger.info('Using AI provider', { providerType: providerResult.data.providerType, modelId });

      const workflowResult = await generateResume({
        provider,
        modelId,
        jobDescription: baseInput.jobDescription,
        userResume,
        userId: baseInput.userId
      });

      if (!workflowResult.success || !workflowResult.resume) {
        logger.error('Resume generation workflow failed');
        return failure(workflowResult.error || 'Failed to generate resume', 'INTERNAL_ERROR');
      }

      logger.info('Workflow completed successfully', {
        tokensUsed: workflowResult.tokensUsed || 0,
      });

      onProgress('save', 'Saving resume to database...', 95);

      const extractedJobTitle = workflowResult.jobTitle || baseInput.jobTitle || 'Position';
      const extractedCompanyName = workflowResult.companyName || baseInput.companyName || 'Company';

      logger.debug('Resume title extracted', { jobTitle: extractedJobTitle, companyName: extractedCompanyName });

      const validatedResume = workflowResult.resume;

      // Save using shared method
      const generatedResume = await this.saveGeneratedResume(
        baseInput,
        validatedResume,
        { tokensUsed: workflowResult.tokensUsed },
        extractedJobTitle,
        extractedCompanyName
      );

      logger.info('Resume saved to database', { resumeId: generatedResume.id });

      // Invalidate cache after generating new resume
      this.invalidateCache(baseInput.userId);

      onProgress('complete', 'Resume generated successfully!', 100);

      return success(this.buildGeneratedResumeResponse(generatedResume));
    } catch (error) {
      logger.error('Resume generation with progress error', error);
      onProgress('error', error instanceof Error ? error.message : 'Unknown error occurred', 0);
      return failure(error instanceof Error ? error.message : 'Unknown error occurred', 'INTERNAL_ERROR');
    }
  }

  /**
   * Generate a standalone cover letter without creating a full resume
   * 
   * @param input - Generation parameters
   * @returns Generated cover letter with database ID
   */
  async generateStandaloneCoverLetter(input: {
    userId: string;
    jobDescription: string;
    personalInstructions?: string;
    modelId?: string;
    profileId?: string;
  }): Promise<ServiceResult<CoverLetterGenerationData>> {
    try {
      logger.info('Starting standalone cover letter generation', { userId: input.userId });

      // Fetch and validate user resume using shared method
      const resumeResult = await this.fetchAndValidateUserResume(input.userId, input.profileId);
      if (!resumeResult.success) {
        return failure(resumeResult.error, resumeResult.code);
      }
      const userResume = resumeResult.data;

      // Resolve provider using shared method
      const providerResult = await this.resolveProvider(input.userId, input.modelId);

      if (!providerResult.success) {
        return failure(providerResult.error, 'INTERNAL_ERROR');
      }

      const provider = providerResult.data.provider;
      const modelId = providerResult.data.modelId;

      logger.debug('Using AI model', { modelId });

      // Generate cover letter directly - no separate job analysis step
      const { generateCoverLetter } = await import('@/lib/ai/agents');
      const coverLetterResult = await generateCoverLetter({
        provider,
        modelId,
        jobDescription: input.jobDescription,
        userResume,
      });

      logger.debug('Cover letter generated', { 
        length: coverLetterResult.content.length,
        jobTitle: coverLetterResult.jobTitle,
        companyName: coverLetterResult.companyName
      });

      // Save to database
      const { coverLetterService } = await import('@/lib/services/cover-letter.service');
      const coverLetterData = {
        userId: input.userId,
        content: coverLetterResult.content,
        jobDescription: input.jobDescription,
        jobTitle: coverLetterResult.jobTitle,
        companyName: coverLetterResult.companyName,
        metadata: {
          model: modelId,
          tokens: 0, // We don't track tokens in standalone generation yet
          generationTime: 0,
          personalInstructions: input.personalInstructions,
        },
      };

      const saveResult = await coverLetterService.createCoverLetter(coverLetterData);

      if (!saveResult.success) {
        logger.error('Failed to save cover letter', { error: saveResult.error });
        return failure(saveResult.error, 'INTERNAL_ERROR');
      }

      logger.info('Cover letter saved', { coverLetterId: saveResult.data.id });

      return success({
        coverLetterId: saveResult.data.id,
        coverLetter: coverLetterResult.content,
        metadata: {
          jobTitle: coverLetterResult.jobTitle,
          companyName: coverLetterResult.companyName,
          tokensUsed: 0,
        },
      });
    } catch (error) {
      logger.error('Standalone cover letter generation failed', error);
      return failure(error instanceof Error ? error.message : 'Failed to generate cover letter', 'INTERNAL_ERROR');
    }
  }
}

// Export singleton instance
export const resumeGenerationService = new ResumeGenerationService();
