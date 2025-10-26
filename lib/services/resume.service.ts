import { GeneratedResumeRepository, generatedResumeRepository } from '@/lib/repositories/generated-resume.repository';
import { generateResume, type GenerateResumeInput } from '@/lib/ai/workflow';
import { profileService } from '@/lib/services/profile.service';

export interface GenerateResumeServiceInput {
  userId: string;
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
}

export interface GenerateResumeServiceResult {
  success: boolean;
  resumeId?: string;
  resume?: {
    id: string;
    content: Record<string, unknown>;
    metadata: Record<string, unknown>;
    createdAt: Date;
  };
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
   * Get all resumes for a user
   */
  async getUserResumes(userId: string) {
    const resumes = await this.repository.findByUserId(userId);
    return resumes.map(resume => ({
      id: resume.id,
      jobMetadata: resume.jobMetadata as Record<string, unknown>,
      content: resume.resumeContent as Record<string, unknown>,
      metadata: resume.metadata as Record<string, unknown>,
      isEdited: resume.isEdited,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt
    }));
  }

  /**
   * Get a specific resume by ID
   */
  async getResume(resumeId: string, userId: string) {
    const resume = await this.repository.findByIdAndUserId(resumeId, userId);
    
    if (!resume) {
      return null;
    }

    return {
      id: resume.id,
      jobDescription: resume.jobDescription,
      jobMetadata: resume.jobMetadata as Record<string, unknown>,
      content: resume.resumeContent as Record<string, unknown>,
      metadata: resume.metadata as Record<string, unknown>,
      isEdited: resume.isEdited,
      aiGeneratedContent: resume.aiGeneratedContent as Record<string, unknown>,
      pdfUrl: resume.pdfUrl,
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
