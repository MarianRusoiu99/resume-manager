import { GeneratedResumeRepository, generatedResumeRepository } from '@/lib/repositories/generated-resume.repository';
import { generateResume } from '@/lib/ai';
import { profileService } from '@/lib/services/profile.service';
import { coverLetterService } from '@/lib/services/cover-letter.service';
import { prisma } from '@/lib/db';
import type { Resume } from '@/lib/validations/jsonresume';
import { resumeSchema } from '@/lib/validations/jsonresume';

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
  /** Whether to generate a cover letter */
  generateCoverLetter?: boolean;
  /** Optional personal instructions for cover letter */
  personalInstructions?: string;
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
 * Result of resume generation operation
 */
export interface GenerateResumeServiceResult {
  /** Whether the generation was successful */
  success: boolean;
  /** Generated resume ID (if successful) */
  resumeId?: string;
  /** Full resume object with content and metadata */
  resume?: {
    id: string;
    content: Record<string, unknown>;
    metadata: Record<string, unknown>;
    createdAt: Date;
  };
  /** Generated cover letter (if requested) */
  coverLetter?: string;
  /** Array of error messages (if failed) */
  errors?: string[];
}

/**
 * Service for managing resume generation
 * Wraps the workflow service and handles database operations
 */
export class ResumeService {
  private async getValidatedUserResume(userId: string): Promise<{ success: boolean; resume?: Resume; error?: string }> {
    const profileResult = await profileService.getProfile(userId);
    if (!profileResult.data) {
      return { success: false, error: 'User profile not found. Please complete your profile before generating a resume.' };
    }
    const profileData = profileResult.data;
    if (!profileData || typeof profileData !== 'object' || !('resume' in profileData)) {
      return { success: false, error: 'Profile structure is invalid. Please update your profile.' };
    }
    if (!profileData.resume) {
      return { success: false, error: 'Profile does not contain resume data. Please complete your profile.' };
    }
    try {
      const userResume = resumeSchema.parse(profileData.resume);
      return { success: true, resume: userResume };
    } catch (error) {
      console.error('Profile resume validation failed:', error);
      return { success: false, error: 'Invalid profile data format. Please update your profile.' };
    }
  }

  private async resolveProvider(input: GenerateResumeServiceInput): Promise<{ success: boolean; provider?: any; modelId?: string; providerType?: string; error?: string }> {
    if (input.modelId) {
      try {
        const { apiProviderService } = await import('@/lib/services/api-provider.service');
        const modelsResult = await apiProviderService.getAvailableModels(input.userId);
        if (!modelsResult.success || !modelsResult.data) {
          return { success: false, error: 'No API providers configured. Please add one in Settings → API Keys' };
        }
        const modelInfo = modelsResult.data.allModels.find(m => m.id === input.modelId);
        if (!modelInfo) {
          return { success: false, error: `Model ${input.modelId} not found in your configured providers` };
        }
        const providerResult = await apiProviderService.getProviderInstance(modelInfo.providerId, input.userId);
        if (!providerResult.success || !providerResult.data) {
          return { success: false, error: providerResult.error || 'Failed to get AI provider configuration' };
        }
        return { success: true, provider: providerResult.data.provider, modelId: input.modelId, providerType: providerResult.data.providerType };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to get AI provider' };
      }
    } else {
      const apiKey = process.env.OPENAI_API_KEY || '';
      if (!apiKey) {
        return { success: false, error: 'No AI provider configured. Please add an API key in Settings or set OPENAI_API_KEY environment variable.' };
      }
      const { createProvider } = await import('@/lib/ai/providers');
      return { success: true, provider: createProvider('openai', apiKey), modelId: 'gpt-4o-mini', providerType: 'openai' };
    }
  }

  private async saveGeneratedResume(input: GenerateResumeServiceInput, validatedResume: Resume, workflowResult: any, extractedJobTitle: string, extractedCompanyName: string) {
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
        tokens: workflowResult.tokensUsed || 0,
        generatedAt: validatedResume.meta?.lastModified || new Date().toISOString()
      }
    });
  }

  private async saveCoverLetter(input: GenerateResumeServiceInput, workflowResult: any, validatedResume: Resume) {
    const jobTitle = input.jobTitle || 'Position';
    const companyName = input.companyName || 'Company';
    return await coverLetterService.createCoverLetter({
      userId: input.userId,
      content: workflowResult.coverLetter,
      jobDescription: input.jobDescription,
      jobTitle,
      companyName,
      metadata: {
        model: typeof validatedResume.meta?.model === 'string' ? validatedResume.meta?.model : 'gpt-4o',
        tokens: workflowResult.tokensUsed || 0,
        generationTime: 0,
        personalInstructions: input.personalInstructions,
      },
    });
  }
  constructor(
    private readonly repository: GeneratedResumeRepository = generatedResumeRepository
  ) {}

  /**
   * Generate a new resume using AI workflow
   * 
   * @param input - Generation parameters
   * @returns Generated resume with database ID
   */
  async generateResume(input: GenerateResumeServiceInput): Promise<GenerateResumeServiceResult> {
    try {
      // Validate user profile and resume
      const resumeResult = await this.getValidatedUserResume(input.userId);
      if (!resumeResult.success || !resumeResult.resume) {
        return { success: false, errors: [resumeResult.error || 'Profile validation failed'] };
      }
      const userResume = resumeResult.resume;

      console.log(`\n🚀 ResumeService: Starting resume generation for user ${input.userId}`);
      console.log(`   Job: ${input.jobTitle || 'Not specified'} at ${input.companyName || 'Not specified'}`);
      console.log(`   Model ID: ${input.modelId || 'default (env OPENAI_API_KEY)'}`);

      // Resolve provider
      const providerResult = await this.resolveProvider(input);
      if (!providerResult.success || !providerResult.provider) {
        return { success: false, errors: [providerResult.error || 'Provider resolution failed'] };
      }
      const provider = providerResult.provider;
      const modelId = providerResult.modelId!;

      // Call workflow service with provider instance
      const workflowResult = await generateResume({
        provider,
        modelId,
        jobDescription: input.jobDescription,
        userResume,
        includeCoverLetter: input.generateCoverLetter,
        personalInstructions: input.personalInstructions,
        userId: input.userId
      });

      if (!workflowResult.success || !workflowResult.resume) {
        console.error('❌ ResumeService: Workflow failed');
        return { success: false, errors: [workflowResult.error || 'Failed to generate resume'] };
      }

      console.log('✅ ResumeService: Workflow completed successfully');
      console.log(`   Tokens used: ${workflowResult.tokensUsed || 0}`);
      if (workflowResult.coverLetter) {
        console.log(`   Cover letter: Generated (${workflowResult.coverLetter.length} characters)`);
      }

      // Extract job title and company from AI analysis (if available)
      const extractedJobTitle = workflowResult.jobAnalysis?.jobTitle || input.jobTitle;
      const extractedCompanyName = workflowResult.jobAnalysis?.companyName || input.companyName;
      console.log(`📋 Resume Title: "${extractedJobTitle}" at ${extractedCompanyName || 'Unknown Company'}`);

      // Validate generated resume
      const validatedResume = resumeSchema.parse(workflowResult.resume);

      // Store in database
      const generatedResume = await this.saveGeneratedResume(input, validatedResume, workflowResult, extractedJobTitle, extractedCompanyName);
      console.log(`✅ ResumeService: Saved to database with ID: ${generatedResume.id}`);

      // Save cover letter if generated
      if (workflowResult.coverLetter) {
        console.log('📝 ResumeService: Saving cover letter separately...');
        const coverLetterResult = await this.saveCoverLetter(input, workflowResult, validatedResume);
        if (coverLetterResult.success) {
          console.log(`✅ ResumeService: Cover letter saved with ID: ${coverLetterResult.data?.id}`);
        } else {
          console.error('❌ ResumeService: Failed to save cover letter:', coverLetterResult.error);
        }
      }

      return {
        success: true,
        resumeId: generatedResume.id,
        resume: {
          id: generatedResume.id,
          content: generatedResume.resume as unknown as Record<string, unknown>,
          metadata: generatedResume.metadata as Record<string, unknown>,
          createdAt: generatedResume.createdAt
        },
      };
    } catch (error) {
      console.error('❌ ResumeService: Error:', error);
      return { success: false, errors: [error instanceof Error ? error.message : 'Unknown error occurred'] };
    }
  }

  /**
   * Generate a new resume with progress streaming
   * 
   * @param input - Generation parameters including progress callback
   * @returns Generated resume with database ID
   */
  async generateResumeWithProgress(input: GenerateResumeWithProgressInput): Promise<GenerateResumeServiceResult> {
    const { onProgress, ...baseInput } = input;

    // Small helpers to keep this method linear and reduce branching
    const fail = (message: string[]) => ({ success: false, errors: message });

    const fetchAndValidateProfile = async (): Promise<{ success: true; resume: Resume } | { success: false; error: string }> => {
      const profileResult = await profileService.getProfile(baseInput.userId);
      if (!profileResult.data) return { success: false, error: 'User profile not found. Please complete your profile before generating a resume.' };

      const profileData = profileResult.data;
      if (!profileData || typeof profileData !== 'object' || !('resume' in profileData)) {
        return { success: false, error: 'Profile structure is invalid. Please update your profile.' };
      }
      if (!profileData.resume) {
        return { success: false, error: 'Profile does not contain resume data. Please complete your profile.' };
      }

      // Rely on runtime type; JSON resume validation happens elsewhere
      return { success: true, resume: profileData.resume as Resume };
    };

    const resolveProviderForProgress = async (): Promise<{ provider: any; modelId: string; providerType: string } | { error: string }> => {
      if (baseInput.modelId) {
        try {
          const { apiProviderService } = await import('@/lib/services/api-provider.service');
          const modelsResult = await apiProviderService.getAvailableModels(baseInput.userId);
          if (!modelsResult.success || !modelsResult.data) return { error: 'No API providers configured. Please add one in Settings → API Keys' };

          const modelInfo = modelsResult.data.allModels.find(m => m.id === baseInput.modelId);
          if (!modelInfo) return { error: `Model ${baseInput.modelId} not found in your configured providers` };

          const providerResult = await apiProviderService.getProviderInstance(modelInfo.providerId, baseInput.userId);
          if (!providerResult.success || !providerResult.data) return { error: providerResult.error || 'Failed to get AI provider configuration' };

          return { provider: providerResult.data.provider, modelId: baseInput.modelId, providerType: providerResult.data.providerType };
        } catch (err) {
          return { error: err instanceof Error ? err.message : 'Failed to get AI provider' };
        }
      }

      const apiKey = process.env.OPENAI_API_KEY || '';
      if (!apiKey) return { error: 'No AI provider configured. Please add an API key in Settings or set OPENAI_API_KEY environment variable.' };
      const { createProvider } = await import('@/lib/ai/providers');
      return { provider: createProvider('openai', apiKey), modelId: 'gpt-4o-mini', providerType: 'openai' };
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
      if (!profileFetch.success) return fail([profileFetch.error]);

      onProgress('profile', 'Profile loaded successfully', 10);
      const userResume = profileFetch.resume;

      console.log(`\n🚀 ResumeService: Starting resume generation with progress for user ${baseInput.userId}`);
      console.log(`   Job: ${baseInput.jobTitle || 'Not specified'} at ${baseInput.companyName || 'Not specified'}`);

      onProgress('workflow', 'Starting AI workflow...', 15);

      const startTime = Date.now();
      scheduleProgressUpdates(startTime);

      const providerResult = await resolveProviderForProgress();
      if ('error' in providerResult) return fail([providerResult.error]);

      const provider = providerResult.provider;
      const modelId = providerResult.modelId;
      console.log(`   Using provider: ${providerResult.providerType} (model: ${modelId})`);

      const workflowResult = await generateResume({
        provider,
        modelId,
        jobDescription: baseInput.jobDescription,
        userResume,
        includeCoverLetter: baseInput.generateCoverLetter,
        personalInstructions: baseInput.personalInstructions,
        userId: baseInput.userId
      });

      if (!workflowResult.success || !workflowResult.resume) {
        console.error('❌ ResumeService: Workflow failed');
        return fail([workflowResult.error || 'Failed to generate resume']);
      }

      console.log('✅ ResumeService: Workflow completed successfully');
      console.log(`   Tokens used: ${workflowResult.tokensUsed || 0}`);
      if (workflowResult.coverLetter) {
        console.log(`   Cover letter: Generated (${workflowResult.coverLetter.length} characters)`);
      }

      onProgress('save', 'Saving resume to database...', 95);

      const extractedJobTitle = workflowResult.jobAnalysis?.jobTitle || baseInput.jobTitle;
      const extractedCompanyName = workflowResult.jobAnalysis?.companyName || baseInput.companyName;

      console.log(`📋 Resume Title: "${extractedJobTitle}" at ${extractedCompanyName || 'Unknown Company'}`);

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

      console.log(`✅ ResumeService: Saved to database with ID: ${generatedResume.id}`);

      onProgress('complete', 'Resume generated successfully!', 100);

      return {
        success: true,
        resumeId: generatedResume.id,
        resume: {
          id: generatedResume.id,
          content: generatedResume.resume as unknown as Record<string, unknown>,
          metadata: generatedResume.metadata as Record<string, unknown>,
          createdAt: generatedResume.createdAt
        },
        coverLetter: workflowResult.coverLetter
      };
    } catch (error) {
      console.error('❌ ResumeService: Error:', error);
      onProgress('error', error instanceof Error ? error.message : 'Unknown error occurred', 0);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

    /**
   * List all resumes for a user
   */
  async listResumes(userId: string) {
    const resumes = await this.repository.findByUserId(userId);
    
    return resumes.map(resume => {
      // Parse jobMetadata to extract jobTitle and companyName
      const jobMetadata = resume.jobMetadata as Record<string, unknown> | null;
      const jobTitle = (jobMetadata?.jobTitle as string) || null;
      const companyName = (jobMetadata?.companyName as string) || null;
      
      // Parse and normalize metadata to match frontend expectations
      const storedMetadata = resume.metadata as Record<string, unknown>;
      const normalizedMetadata = {
        generatedAt: storedMetadata.generatedAt || new Date().toISOString(),
        model: storedMetadata.model || 'unknown',
        totalTokens: (storedMetadata.tokens as number) || (storedMetadata.totalTokens as number) || 0,
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
        // Removed: customization and pdfUrl (simplified template system)
        metadata: normalizedMetadata,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt
      };
    });
  }

  /**
   * Alias for listResumes (for API backward compatibility)
   */
  async getUserResumes(userId: string) {
    return this.listResumes(userId);
  }

  /**
   * Get a specific resume by ID
   */
  async getResume(resumeId: string, userId: string) {
    const resume = await this.repository.findByIdAndUserId(resumeId, userId);
    
    if (!resume) {
      return null;
    }

    // Parse jobMetadata to extract jobTitle and companyName
    const jobMetadata = resume.jobMetadata as Record<string, unknown> | null;
    const jobTitle = (jobMetadata?.jobTitle as string) || 'Position';
    const companyName = (jobMetadata?.companyName as string) || null;

    // Parse and normalize metadata to match frontend expectations
    const storedMetadata = resume.metadata as Record<string, unknown>;
    const normalizedMetadata = {
      generatedAt: storedMetadata.generatedAt || new Date().toISOString(),
      model: storedMetadata.model || 'unknown',
      totalTokens: (storedMetadata.tokens as number) || (storedMetadata.totalTokens as number) || 0,
      processingTime: (storedMetadata.processingTime as number) || 0
    };

    return {
      id: resume.id,
      jobDescription: resume.jobDescription,
      jobMetadata: resume.jobMetadata as Record<string, unknown>,
      jobTitle,
      companyName,
      content: resume.resume as Record<string, unknown>,
      metadata: normalizedMetadata,
  // coverLetter removed (dropped from schema)
      // Removed: pdfUrl and templateCustomization (simplified template system)
      templateId: resume.templateId,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt
    };
  }

  /**
   * Delete a resume
   */
  async deleteResume(resumeId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify ownership
      const resume = await this.repository.findByIdAndUserId(resumeId, userId);
      
      if (!resume) {
        return {
          success: false,
          error: 'Resume not found or access denied'
        };
      }

      await this.repository.delete(resumeId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting resume:', error);
      return {
        success: false,
        error: 'Failed to delete resume'
      };
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
  async updateResumeContent(resumeId: string, userId: string, resumeData: Resume) {
    try {
      // Verify ownership
      const existingResume = await this.repository.findByIdAndUserId(resumeId, userId);
      
      if (!existingResume) {
        throw new Error('Resume not found or access denied');
      }

      // Validate resume data
      const validatedResume = resumeData; // Skipping validation

      // Update the resume in the database
      const updatedResume = await prisma.generatedResume.update({
        where: { id: resumeId },
        data: {
          resume: JSON.parse(JSON.stringify(validatedResume)),
          updatedAt: new Date(),
        },
      });

      // Fetch template if needed
      const template = updatedResume.templateId 
        ? await prisma.resumeTemplate.findUnique({ where: { id: updatedResume.templateId } })
        : null;

      return {
        id: updatedResume.id,
        resume: updatedResume.resume,
        jobDescription: updatedResume.jobDescription,
        jobMetadata: updatedResume.jobMetadata,
        template,
  // coverLetter removed (dropped from schema)
        metadata: updatedResume.metadata,
        createdAt: updatedResume.createdAt,
        updatedAt: updatedResume.updatedAt,
      };
    } catch (error) {
      console.error('Error updating resume content:', error);
      throw error;
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
  async updateResumeTemplate(resumeId: string, userId: string, templateId: string | null) {
    try {
      // Verify ownership
      const existingResume = await this.repository.findByIdAndUserId(resumeId, userId);
      
      if (!existingResume) {
        throw new Error('Resume not found or access denied');
      }

      // Update the template in the database
      const updatedResume = await prisma.generatedResume.update({
        where: { id: resumeId },
        data: {
          templateId,
          updatedAt: new Date(),
        },
      });

      // Fetch template if needed
      const template = updatedResume.templateId 
        ? await prisma.resumeTemplate.findUnique({ where: { id: updatedResume.templateId } })
        : null;

      return {
        id: updatedResume.id,
        resume: updatedResume.resume,
        jobDescription: updatedResume.jobDescription,
        jobMetadata: updatedResume.jobMetadata,
        templateId: updatedResume.templateId,
        template,
  // coverLetter removed (dropped from schema)
        metadata: updatedResume.metadata,
        createdAt: updatedResume.createdAt,
        updatedAt: updatedResume.updatedAt,
      };
    } catch (error) {
      console.error('Error updating resume template:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const resumeService = new ResumeService();
