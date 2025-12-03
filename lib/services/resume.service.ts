import { GeneratedResumeRepository, generatedResumeRepository } from '@/lib/repositories/generated-resume.repository';
import { generateResume } from '@/lib/ai';
import { profileService } from '@/lib/services/profile.service';
import { resumesCache } from '@/lib/cache/resumes-cache';
import type { Resume } from '@/lib/validations/jsonresume';
import { resumeSchema } from '@/lib/validations/jsonresume';
import type { OptimizedResume } from '@/lib/ai/agents';
import { logger } from '@/lib/utils/logger';
import { success, failure, type ServiceResult } from '@/lib/types/service-result';

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
 * Service for managing resume generation
 * Wraps the workflow service and handles database operations
 */
export class ResumeService {
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

  private async getValidatedUserResume(userId: string): Promise<ServiceResult<Resume>> {
    const profileResult = await profileService.getProfile(userId);
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
    try {
      const userResume = resumeSchema.parse(profileData.resume);
      return success(userResume);
    } catch (error) {
      logger.error('Profile resume validation failed', error);
      return failure('Invalid profile data format. Please update your profile.', 'VALIDATION_ERROR');
    }
  }

  private async resolveProvider(input: GenerateResumeServiceInput): Promise<ServiceResult<{ provider: import('@/lib/ai/providers').AIProvider; modelId: string; providerType: string }>> {
    if (input.modelId) {
      try {
        const { apiProviderService } = await import('@/lib/services/api-provider.service');
        const modelsResult = await apiProviderService.getAvailableModels(input.userId);
        if (!modelsResult.success) {
          return failure('No API providers configured. Please add one in Settings → API Keys', 'NOT_FOUND');
        }
        const modelInfo = modelsResult.data.allModels.find(m => m.id === input.modelId);
        if (!modelInfo) {
          return failure(`Model ${input.modelId} not found in your configured providers`, 'NOT_FOUND');
        }
        const providerResult = await apiProviderService.getProviderInstance(modelInfo.providerId, input.userId);
        if (!providerResult.success) {
          return failure(providerResult.error || 'Failed to get AI provider configuration', 'INTERNAL_ERROR');
        }
        return success({ provider: providerResult.data.provider, modelId: input.modelId, providerType: providerResult.data.providerType });
      } catch (error) {
        return failure(error instanceof Error ? error.message : 'Failed to get AI provider', 'INTERNAL_ERROR');
      }
    } else {
      const apiKey = process.env.OPENAI_API_KEY || '';
      if (!apiKey) {
        return failure('No AI provider configured. Please add an API key in Settings or set OPENAI_API_KEY environment variable.', 'NOT_FOUND');
      }
      const { createProvider } = await import('@/lib/ai/providers');
      return success({ provider: createProvider('openai', apiKey), modelId: 'gpt-4o-mini', providerType: 'openai' });
    }
  }

  private async saveGeneratedResume(input: GenerateResumeServiceInput, validatedResume: Resume, workflowResult: unknown, extractedJobTitle: string, extractedCompanyName: string) {
    const result = workflowResult as { tokensUsed?: number };
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
        totalTokens: result.tokensUsed || 0,
        generatedAt: validatedResume.meta?.lastModified || new Date().toISOString()
      }
    });
  }

  constructor(
    private readonly repository: GeneratedResumeRepository = generatedResumeRepository
  ) { }

  /**
   * Generate a new resume using AI workflow
   * 
   * @param input - Generation parameters
   * @returns Generated resume with database ID
   */
  async generateResume(input: GenerateResumeServiceInput): Promise<ServiceResult<GeneratedResumeData>> {
    try {
      // Validate user profile and resume
      const resumeResult = await this.getValidatedUserResume(input.userId);
      if (!resumeResult.success) {
        return failure(resumeResult.error, 'VALIDATION_ERROR');
      }
      const userResume = resumeResult.data;

      logger.info('Starting resume generation', {
        userId: input.userId,
        jobTitle: input.jobTitle || 'Not specified',
        companyName: input.companyName || 'Not specified',
        modelId: input.modelId || 'default (env OPENAI_API_KEY)'
      });

      // Resolve provider
      const providerResult = await this.resolveProvider(input);
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
        includeCoverLetter: false,
        userId: input.userId
      });

      if (!workflowResult.success || !workflowResult.resume) {
        logger.error('Resume generation workflow failed');
        return failure(workflowResult.error || 'Failed to generate resume', 'INTERNAL_ERROR');
      }

      logger.info('Workflow completed successfully', {
        tokensUsed: workflowResult.tokensUsed || 0,
      });

      // Extract job title and company from AI analysis (if available)
      const extractedJobTitle = workflowResult.jobAnalysis?.jobTitle || input.jobTitle || 'Position';
      const extractedCompanyName = workflowResult.jobAnalysis?.companyName || input.companyName || 'Company';
      logger.debug('Resume title extracted', { jobTitle: extractedJobTitle, companyName: extractedCompanyName });

      // Validate generated resume
      const validatedResume = resumeSchema.parse(workflowResult.resume);

      // Store in database
      const generatedResume = await this.saveGeneratedResume(input, validatedResume, workflowResult, extractedJobTitle, extractedCompanyName);
      logger.info('Resume saved to database', { resumeId: generatedResume.id });

      // Invalidate cache after generating new resume
      this.invalidateCache(input.userId);

      return success({
        resumeId: generatedResume.id,
        resume: {
          id: generatedResume.id,
          content: generatedResume.resume as unknown as Record<string, unknown>,
          metadata: generatedResume.metadata as Record<string, unknown>,
          createdAt: generatedResume.createdAt
        },
      });
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

    const fetchAndValidateProfile = async (): Promise<ServiceResult<Resume>> => {
      // Use profileId if provided, otherwise get default profile
      const profileResult = baseInput.profileId
        ? await profileService.getProfileById(baseInput.profileId, baseInput.userId)
        : await profileService.getProfile(baseInput.userId);

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

      // Rely on runtime type; JSON resume validation happens elsewhere
      return success(profileData.resume as Resume);
    };

    const resolveProviderForProgress = async (): Promise<ServiceResult<{ provider: import('@/lib/ai/providers').AIProvider; modelId: string; providerType: string }>> => {
      if (baseInput.modelId) {
        try {
          const { apiProviderService } = await import('@/lib/services/api-provider.service');
          const modelsResult = await apiProviderService.getAvailableModels(baseInput.userId);
          if (!modelsResult.success) {
            return failure('No API providers configured. Please add one in Settings → API Keys', 'NOT_FOUND');
          }

          const modelInfo = modelsResult.data.allModels.find(m => m.id === baseInput.modelId);
          if (!modelInfo) {
            return failure(`Model ${baseInput.modelId} not found in your configured providers`, 'NOT_FOUND');
          }

          const providerResult = await apiProviderService.getProviderInstance(modelInfo.providerId, baseInput.userId);
          if (!providerResult.success) {
            return failure(providerResult.error || 'Failed to get AI provider configuration', 'INTERNAL_ERROR');
          }

          return success({ provider: providerResult.data.provider, modelId: baseInput.modelId, providerType: providerResult.data.providerType });
        } catch (err) {
          return failure(err instanceof Error ? err.message : 'Failed to get AI provider', 'INTERNAL_ERROR');
        }
      }

      const apiKey = process.env.OPENAI_API_KEY || '';
      if (!apiKey) {
        return failure('No AI provider configured. Please add an API key in Settings or set OPENAI_API_KEY environment variable.', 'NOT_FOUND');
      }
      const { createProvider } = await import('@/lib/ai/providers');
      return success({ provider: createProvider('openai', apiKey), modelId: 'gpt-4o-mini', providerType: 'openai' });
    };

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

      onProgress('profile', 'Fetching your profile data...', 5);
      const profileFetch = await fetchAndValidateProfile();
      if (!profileFetch.success) {
        return failure(profileFetch.error, profileFetch.code);
      }

      onProgress('profile', 'Profile loaded successfully', 10);
      const userResume = profileFetch.data;

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

      const providerResult = await resolveProviderForProgress();
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
        includeCoverLetter: false,
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

      const extractedJobTitle = workflowResult.jobAnalysis?.jobTitle || baseInput.jobTitle;
      const extractedCompanyName = workflowResult.jobAnalysis?.companyName || baseInput.companyName;

      logger.debug('Resume title extracted', { jobTitle: extractedJobTitle, companyName: extractedCompanyName || 'Unknown Company' });

      const validatedResume = workflowResult.resume;

      const generatedResume = await this.repository.create({
        userId: baseInput.userId,
        jobDescription: baseInput.jobDescription,
        jobMetadata: {
          jobTitle: extractedJobTitle,
          companyName: extractedCompanyName
        },
        templateId: baseInput.templateId ?? undefined,
        resume: validatedResume,
        metadata: {
          model: validatedResume.meta?.model || 'unknown',
          tokens: workflowResult.tokensUsed || 0,
          generatedAt: validatedResume.meta?.lastModified || new Date().toISOString()
        }
      });

      logger.info('Resume saved to database', { resumeId: generatedResume.id });

      // Invalidate cache after generating new resume
      this.invalidateCache(baseInput.userId);

      onProgress('complete', 'Resume generated successfully!', 100);

      return success({
        resumeId: generatedResume.id,
        resume: {
          id: generatedResume.id,
          content: generatedResume.resume as unknown as Record<string, unknown>,
          metadata: generatedResume.metadata as Record<string, unknown>,
          createdAt: generatedResume.createdAt
        },
      });
    } catch (error) {
      logger.error('Resume generation with progress error', error);
      onProgress('error', error instanceof Error ? error.message : 'Unknown error occurred', 0);
      return failure(error instanceof Error ? error.message : 'Unknown error occurred', 'INTERNAL_ERROR');
    }
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

      // Validate user profile and resume
      // Use same validation logic as resume generation
      let userResume: Resume;
      if (input.profileId) {
        // Use selected profile
        const profileResult = await profileService.getProfileById(input.profileId, input.userId);
        if (!profileResult.success) {
          return failure(profileResult.error, 'NOT_FOUND');
        }
        const profileData = profileResult.data;
        if (!profileData || typeof profileData !== 'object' || !('resume' in profileData) || !profileData.resume) {
          return failure('Profile does not contain resume data. Please complete your profile.', 'VALIDATION_ERROR');
        }
        try {
          userResume = resumeSchema.parse(profileData.resume);
        } catch {
          return failure('Invalid profile data format. Please update your profile.', 'VALIDATION_ERROR');
        }
      } else {
        // Fallback to default profile
        const resumeResult = await this.getValidatedUserResume(input.userId);
        if (!resumeResult.success) {
          return failure(resumeResult.error, 'VALIDATION_ERROR');
        }
        userResume = resumeResult.data;
      }

      // Resolve provider
      const providerResult = await this.resolveProvider({
        userId: input.userId,
        modelId: input.modelId,
        profileId: input.profileId,
      } as GenerateResumeServiceInput);

      if (!providerResult.success) {
        return failure(providerResult.error, 'INTERNAL_ERROR');
      }

      const provider = providerResult.data.provider;
      const modelId = providerResult.data.modelId;

      logger.debug('Using AI model', { modelId });

      // Step 1: Analyze job to extract title and company
      const { analyzeJob } = await import('@/lib/ai/agents');
      const jobAnalysis = await analyzeJob({
        provider,
        modelId,
        jobDescription: input.jobDescription,
      });

      logger.debug('Job analysis complete', { jobTitle: jobAnalysis.jobTitle, companyName: jobAnalysis.companyName });

      // Step 2: Generate cover letter using user's original resume
      const { generateCoverLetter } = await import('@/lib/ai/agents');
      const coverLetterResult = await generateCoverLetter({
        provider,
        modelId,
        jobAnalysis,
        userResume: userResume!,
        optimizedResume: userResume as OptimizedResume, // Use original resume as optimized resume for standalone generation
      });

      logger.debug('Cover letter generated', { length: coverLetterResult.content.length });

      // Step 3: Save to database
      const { coverLetterService } = await import('@/lib/services/cover-letter.service');
      const coverLetterData = {
        userId: input.userId,
        content: coverLetterResult.content,
        jobDescription: input.jobDescription,
        jobTitle: jobAnalysis.jobTitle,
        companyName: jobAnalysis.companyName,
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
          jobTitle: jobAnalysis.jobTitle,
          companyName: jobAnalysis.companyName,
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
export const resumeService = new ResumeService();
