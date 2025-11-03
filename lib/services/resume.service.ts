import { GeneratedResumeRepository, generatedResumeRepository } from '@/lib/repositories/generated-resume.repository';
import { generateResume } from '@/lib/ai/workflow';
import { profileService } from '@/lib/services/profile.service';
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
  /** Array of error messages (if failed) */
  errors?: string[];
}

/**
 * Service for managing resume generation
 * Wraps the workflow service and handles database operations
 */
export class ResumeService {
  constructor(
    private repository: GeneratedResumeRepository = generatedResumeRepository
  ) {}

  /**
   * Generate a new resume using AI workflow
   * 
   * @param input - Generation parameters
   * @returns Generated resume with database ID
   */
  async generateResume(input: GenerateResumeServiceInput): Promise<GenerateResumeServiceResult> {
    try {
      // Get user's profile
      const profileResult = await profileService.getProfile(input.userId);
      
      if (!profileResult.data) {
        return {
          success: false,
          errors: ['User profile not found. Please complete your profile before generating a resume.']
        };
      }

      const profileData = profileResult.data;
      
      // Type guard to ensure we have a profile with resume field
      if (!profileData || typeof profileData !== 'object' || !('resume' in profileData)) {
        return {
          success: false,
          errors: ['Profile structure is invalid. Please update your profile.']
        };
      }

      // Extract and validate Resume from profile
      if (!profileData.resume) {
        return {
          success: false,
          errors: ['Profile does not contain resume data. Please complete your profile.']
        };
      }

      // Validate the resume data against JSON Resume schema
      let userResume: Resume;
      try {
        userResume = resumeSchema.parse(profileData.resume);
      } catch (error) {
        console.error('Profile resume validation failed:', error);
        return {
          success: false,
          errors: ['Invalid profile data format. Please update your profile.']
        };
      }

      console.log(`\n🚀 ResumeService: Starting resume generation for user ${input.userId}`);
      console.log(`   Job: ${input.jobTitle || 'Not specified'} at ${input.companyName || 'Not specified'}`);

      // Call workflow service with Resume
      const workflowResult = await generateResume({
        userId: input.userId,
        jobDescription: input.jobDescription,
        jobTitle: input.jobTitle,
        companyName: input.companyName,
        userResume
      });

      if (!workflowResult.success || !workflowResult.resume) {
        console.error('❌ ResumeService: Workflow failed');
        return {
          success: false,
          errors: workflowResult.errors || ['Failed to generate resume']
        };
      }

      console.log('✅ ResumeService: Workflow completed successfully');
      console.log(`   Tokens used: ${workflowResult.tokensUsed || 0}`);

      // Validate generated resume
      const validatedResume = resumeSchema.parse(workflowResult.resume);

      // Store in database
      const generatedResume = await this.repository.create({
        userId: input.userId,
        jobDescription: input.jobDescription,
        jobMetadata: {
          jobTitle: input.jobTitle,
          companyName: input.companyName
        },
        templateId: input.templateId ?? undefined,
        resume: validatedResume,
        metadata: {
          model: validatedResume.meta?.model || 'unknown',
          tokens: workflowResult.tokensUsed || 0,
          generatedAt: validatedResume.meta?.lastModified || new Date().toISOString()
        }
      });

      console.log(`✅ ResumeService: Saved to database with ID: ${generatedResume.id}`);

      return {
        success: true,
        resumeId: generatedResume.id,
        resume: {
          id: generatedResume.id,
          content: generatedResume.resume as unknown as Record<string, unknown>,
          metadata: generatedResume.metadata as Record<string, unknown>,
          createdAt: generatedResume.createdAt
        }
      };
    } catch (error) {
      console.error('❌ ResumeService: Error:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
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

    try {
      // Report initial progress
      onProgress('init', 'Initializing resume generation...', 0);

      // Get user's profile
      onProgress('profile', 'Fetching your profile data...', 5);
      const profileResult = await profileService.getProfile(baseInput.userId);
      
      if (!profileResult.data) {
        return {
          success: false,
          errors: ['User profile not found. Please complete your profile before generating a resume.']
        };
      }

      const profileData = profileResult.data;
      
      // Type guard to ensure we have a profile with resume field
      if (!profileData || typeof profileData !== 'object' || !('resume' in profileData)) {
        return {
          success: false,
          errors: ['Profile structure is invalid. Please update your profile.']
        };
      }

      // Extract and validate Resume from profile
      if (!profileData.resume) {
        return {
          success: false,
          errors: ['Profile does not contain resume data. Please complete your profile.']
        };
      }

      onProgress('profile', 'Profile loaded successfully', 10);

      // Validate the resume data against JSON Resume schema
      let userResume: Resume;
      try {
        userResume = resumeSchema.parse(profileData.resume);
      } catch (error) {
        console.error('Profile resume validation failed:', error);
        return {
          success: false,
          errors: ['Invalid profile data format. Please update your profile.']
        };
      }

      console.log(`\n🚀 ResumeService: Starting resume generation with progress for user ${baseInput.userId}`);
      console.log(`   Job: ${baseInput.jobTitle || 'Not specified'} at ${baseInput.companyName || 'Not specified'}`);

      // Report workflow start
      onProgress('workflow', 'Starting AI workflow...', 15);

      // Simulate workflow progress (in real implementation, the workflow would call onProgress)
      // For now, we'll update progress at estimated intervals
      const startTime = Date.now();

      // Job Analysis Phase (15-35%)
      onProgress('job-analysis', 'Analyzing job description...', 20);
      
      // Profile Matching Phase (35-55%)
      setTimeout(() => {
        if (Date.now() - startTime < 30000) { // Only if still running
          onProgress('profile-matching', 'Matching your profile to job requirements...', 40);
        }
      }, 3000);

      // Content Optimization Phase (55-75%)
      setTimeout(() => {
        if (Date.now() - startTime < 30000) {
          onProgress('content-optimization', 'Optimizing resume content...', 60);
        }
      }, 8000);

      // Format Validation Phase (75-85%)
      setTimeout(() => {
        if (Date.now() - startTime < 30000) {
          onProgress('format-validation', 'Validating ATS compatibility...', 75);
        }
      }, 13000);

      // Output Generation Phase (85-95%)
      setTimeout(() => {
        if (Date.now() - startTime < 30000) {
          onProgress('output-generation', 'Generating final resume...', 85);
        }
      }, 18000);

      // Call workflow service with Resume
      const workflowResult = await generateResume({
        userId: baseInput.userId,
        jobDescription: baseInput.jobDescription,
        jobTitle: baseInput.jobTitle,
        companyName: baseInput.companyName,
        userResume
      });

      if (!workflowResult.success || !workflowResult.resume) {
        console.error('❌ ResumeService: Workflow failed');
        return {
          success: false,
          errors: workflowResult.errors || ['Failed to generate resume']
        };
      }

      console.log('✅ ResumeService: Workflow completed successfully');
      console.log(`   Tokens used: ${workflowResult.tokensUsed || 0}`);

      onProgress('save', 'Saving resume to database...', 95);

      // Validate generated resume
      const validatedResume = resumeSchema.parse(workflowResult.resume);

      // Store in database
      const generatedResume = await this.repository.create({
        userId: baseInput.userId,
        jobDescription: baseInput.jobDescription,
        jobMetadata: {
          jobTitle: baseInput.jobTitle,
          companyName: baseInput.companyName
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
        }
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
      coverLetter: resume.coverLetter,
      // Removed: pdfUrl and templateCustomization (simplified template system)
      templateId: resume.templateId,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt
    };
  }

  /**
   * Update PDF URL for a resume
   */
  async updatePdfUrl(resumeId: string, userId: string, pdfUrl: string): Promise<void> {
    // Verify ownership
    const resume = await this.repository.findByIdAndUserId(resumeId, userId);
    
    if (!resume) {
      throw new Error('Resume not found or access denied');
    }

    await this.repository.updatePdfUrl(resumeId, pdfUrl);
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
   * Update resume content (edit a generated resume)
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
      const validatedResume = resumeSchema.parse(resumeData);

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
        coverLetter: updatedResume.coverLetter,
        metadata: updatedResume.metadata,
        createdAt: updatedResume.createdAt,
        updatedAt: updatedResume.updatedAt,
      };
    } catch (error) {
      console.error('Error updating resume content:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const resumeService = new ResumeService();
