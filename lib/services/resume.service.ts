import { GeneratedResumeRepository, generatedResumeRepository } from '@/lib/repositories/generated-resume.repository';
import { generateResume, type GenerateResumeInput } from '@/lib/ai/workflow';
import { profileService } from '@/lib/services/profile.service';

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

      const profile = profileResult.data;
      
      // Type guard to ensure profile has required properties
      if (!profile || typeof profile !== 'object' || !('personalInfo' in profile)) {
        return {
          success: false,
          errors: ['Invalid profile data. Please update your profile.']
        };
      }

      const personalInfo = profile.personalInfo as {
        name: string;
        email: string;
        phone?: string;
        location?: string;
        linkedin?: string;
        github?: string;
        website?: string;
      };
      const experience = profile.experience as Array<{
        company: string;
        title: string;
        startDate: string;
        endDate: string | null;
        current: boolean;
        description: string;
      }>;
      const education = profile.education as Array<{
        school: string;
        degree: string;
        field: string;
        gpa: string | null;
        startDate: string;
        endDate: string | null;
        description: string | null;
      }>;
      const skills = profile.skills as {
        technical: string[];
        soft: string[];
        languages: string[];
      };

      // Convert profile to workflow format
      const userProfile: GenerateResumeInput['userProfile'] = {
        personalInfo: {
          name: personalInfo.name,
          email: personalInfo.email,
          phone: personalInfo.phone,
          location: personalInfo.location,
          linkedin: personalInfo.linkedin,
          github: personalInfo.github,
          website: personalInfo.website
        },
        summary: profile.summary || undefined,
        experience: experience.map(exp => ({
          company: exp.company,
          title: exp.title,
          startDate: exp.startDate,
          endDate: exp.endDate || undefined,
          current: exp.current,
          description: exp.description
        })),
        education: education.map(edu => ({
          school: edu.school,
          degree: edu.degree,
          field: edu.field,
          gpa: edu.gpa || undefined,
          startDate: edu.startDate,
          endDate: edu.endDate || undefined,
          description: edu.description || undefined
        })),
        skills
      };

      console.log(`\n🚀 ResumeService: Starting resume generation for user ${input.userId}`);
      console.log(`   Job: ${input.jobTitle || 'Not specified'} at ${input.companyName || 'Not specified'}`);

      // Call workflow service
      const workflowResult = await generateResume({
        userId: input.userId,
        jobDescription: input.jobDescription,
        jobTitle: input.jobTitle,
        companyName: input.companyName,
        userProfile
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

      // Store in database
      const generatedResume = await this.repository.create({
        userId: input.userId,
        jobDescription: input.jobDescription,
        jobMetadata: {
          jobTitle: input.jobTitle,
          companyName: input.companyName
        },
  templateId: input.templateId ?? undefined,
        resumeContent: workflowResult.resume as unknown as Record<string, unknown>,
        metadata: {
          model: workflowResult.resume.metadata.modelUsed,
          tokens: workflowResult.tokensUsed || 0,
          generatedAt: workflowResult.resume.metadata.generatedAt
        }
      });

      console.log(`✅ ResumeService: Saved to database with ID: ${generatedResume.id}`);

      return {
        success: true,
        resumeId: generatedResume.id,
        resume: {
          id: generatedResume.id,
          content: generatedResume.resumeContent as Record<string, unknown>,
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

      const profile = profileResult.data;
      
      // Type guard to ensure profile has required properties
      if (!profile || typeof profile !== 'object' || !('personalInfo' in profile)) {
        return {
          success: false,
          errors: ['Invalid profile data. Please update your profile.']
        };
      }

      onProgress('profile', 'Profile loaded successfully', 10);

      const personalInfo = profile.personalInfo as {
        name: string;
        email: string;
        phone?: string;
        location?: string;
        linkedin?: string;
        github?: string;
        website?: string;
      };
      const experience = profile.experience as Array<{
        company: string;
        title: string;
        startDate: string;
        endDate: string | null;
        current: boolean;
        description: string;
      }>;
      const education = profile.education as Array<{
        school: string;
        degree: string;
        field: string;
        gpa: string | null;
        startDate: string;
        endDate: string | null;
        description: string | null;
      }>;
      const skills = profile.skills as {
        technical: string[];
        soft: string[];
        languages: string[];
      };

      // Convert profile to workflow format
      const userProfile: GenerateResumeInput['userProfile'] = {
        personalInfo: {
          name: personalInfo.name,
          email: personalInfo.email,
          phone: personalInfo.phone,
          location: personalInfo.location,
          linkedin: personalInfo.linkedin,
          github: personalInfo.github,
          website: personalInfo.website
        },
        summary: profile.summary || undefined,
        experience: experience.map(exp => ({
          company: exp.company,
          title: exp.title,
          startDate: exp.startDate,
          endDate: exp.endDate || undefined,
          current: exp.current,
          description: exp.description
        })),
        education: education.map(edu => ({
          school: edu.school,
          degree: edu.degree,
          field: edu.field,
          gpa: edu.gpa || undefined,
          startDate: edu.startDate,
          endDate: edu.endDate || undefined,
          description: edu.description || undefined
        })),
        skills
      };

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

      // Call workflow service
      const workflowResult = await generateResume({
        userId: baseInput.userId,
        jobDescription: baseInput.jobDescription,
        jobTitle: baseInput.jobTitle,
        companyName: baseInput.companyName,
        userProfile
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

      // Store in database
      const generatedResume = await this.repository.create({
        userId: baseInput.userId,
        jobDescription: baseInput.jobDescription,
        jobMetadata: {
          jobTitle: baseInput.jobTitle,
          companyName: baseInput.companyName
        },
        templateId: baseInput.templateId ?? undefined,
        resumeContent: workflowResult.resume as unknown as Record<string, unknown>,
        metadata: {
          model: workflowResult.resume.metadata.modelUsed,
          tokens: workflowResult.tokensUsed || 0,
          generatedAt: workflowResult.resume.metadata.generatedAt
        }
      });

      console.log(`✅ ResumeService: Saved to database with ID: ${generatedResume.id}`);

      onProgress('complete', 'Resume generated successfully!', 100);

      return {
        success: true,
        resumeId: generatedResume.id,
        resume: {
          id: generatedResume.id,
          content: generatedResume.resumeContent as Record<string, unknown>,
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
   * Get all resumes for a user
   */
  async getUserResumes(userId: string) {
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
        content: resume.resumeContent as Record<string, unknown>,
        templateId: resume.templateId,
        customization: resume.templateCustomization as Record<string, unknown> | null,
        pdfUrl: resume.pdfUrl,
        isEdited: resume.isEdited,
        metadata: normalizedMetadata,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt
      };
    });
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
      content: resume.resumeContent as Record<string, unknown>,
      metadata: normalizedMetadata,
      isEdited: resume.isEdited,
      aiGeneratedContent: resume.aiGeneratedContent as Record<string, unknown>,
      coverLetter: resume.coverLetter,
      pdfUrl: resume.pdfUrl,
      templateId: resume.templateId,
      templateCustomization: resume.templateCustomization as Record<string, unknown> | null,
      sectionOrder: resume.sectionOrder as string[] | null,
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
}

// Export singleton instance
export const resumeService = new ResumeService();
