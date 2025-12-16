import { GeneratedResumeRepository, generatedResumeRepository } from '@/lib/repositories/generated-resume.repository';
import { generateResume } from '@/lib/ai';
import { logger } from '@/lib/utils/logger';
import { failure, success, type ServiceResult } from '@/lib/types/service-result';
import type { Resume } from '@/lib/validations/jsonresume';

import type { IResumeGenerationService } from '../interfaces';

import { invalidateResumesCache } from './cache';
import { fetchAndValidateUserResume } from './profile';
import { resolveProvider, type ResumeGenerationFeature } from './provider';
import { saveGeneratedResume, buildGeneratedResumeResponse } from './persistence';
import { scheduleProgressUpdates } from './progress';
import type {
  CoverLetterGenerationData,
  GeneratedResumeData,
  GenerateResumeServiceInput,
  GenerateResumeWithProgressInput,
} from './types';

/**
 * Service for resume generation using AI.
 * Single Responsibility: Orchestrates AI-powered resume generation workflow.
 */
export class ResumeGenerationService implements IResumeGenerationService {
  constructor(private readonly repository: GeneratedResumeRepository = generatedResumeRepository) {}

  async generateResume(input: GenerateResumeServiceInput): Promise<ServiceResult<GeneratedResumeData>> {
    try {
      const resumeResult = await fetchAndValidateUserResume(input.userId, input.profileId);
      if (!resumeResult.success) {
        return failure(resumeResult.error, 'VALIDATION_ERROR');
      }
      const userResume = resumeResult.data;

      logger.info('Starting resume generation', {
        userId: input.userId,
        jobTitle: input.jobTitle || 'Not specified',
        companyName: input.companyName || 'Not specified',
        modelId: input.modelId || 'auto-selected',
      });

      const providerResult = await resolveProvider(input.userId, input.modelId, 'resume');
      if (!providerResult.success) {
        return failure(providerResult.error, 'INTERNAL_ERROR');
      }

      const provider = providerResult.data.provider;
      const modelId = providerResult.data.modelId;

      const workflowResult = await generateResume({
        provider,
        modelId,
        jobDescription: input.jobDescription,
        userResume,
        userId: input.userId,
      });

      if (!workflowResult.success || !workflowResult.resume) {
        logger.error('Resume generation workflow failed');
        return failure(workflowResult.error || 'Failed to generate resume', 'INTERNAL_ERROR');
      }

      logger.info('Workflow completed successfully', {
        tokensUsed: workflowResult.tokensUsed || 0,
      });

      const extractedJobTitle = workflowResult.jobTitle || input.jobTitle || 'Position';
      const extractedCompanyName = workflowResult.companyName || input.companyName || 'Company';
      logger.debug('Resume title extracted', { jobTitle: extractedJobTitle, companyName: extractedCompanyName });

      const validatedResume = workflowResult.resume as Resume;

      const generatedResume = await saveGeneratedResume(
        this.repository,
        input,
        validatedResume,
        workflowResult,
        extractedJobTitle,
        extractedCompanyName
      );

      logger.info('Resume saved to database', { resumeId: generatedResume.id });

      invalidateResumesCache(input.userId);

      return success(buildGeneratedResumeResponse(generatedResume));
    } catch (error) {
      logger.error('Resume generation error', error);
      return failure(error instanceof Error ? error.message : 'Unknown error occurred', 'INTERNAL_ERROR');
    }
  }

  async generateResumeWithProgress(
    input: GenerateResumeWithProgressInput
  ): Promise<ServiceResult<GeneratedResumeData>> {
    const { onProgress, ...baseInput } = input;

    try {
      onProgress('init', 'Initializing resume generation...', 0);

      onProgress('profile', 'Fetching your profile data...', 5);
      const profileResult = await fetchAndValidateUserResume(
        baseInput.userId,
        baseInput.profileId,
        true // skip validation
      );
      if (!profileResult.success) {
        return failure(profileResult.error, profileResult.code);
      }

      onProgress('profile', 'Profile loaded successfully', 10);
      const userResume = profileResult.data;

      logger.debug('Profile summary', {
        name: userResume.basics?.name || 'Not set',
        email: userResume.basics?.email || 'Not set',
        workExperience: userResume.work?.length || 0,
        education: userResume.education?.length || 0,
        skills: userResume.skills?.length || 0,
      });

      logger.info('Starting resume generation with progress', { userId: baseInput.userId });

      logger.debug('Job details', {
        jobTitle: baseInput.jobTitle || 'Not specified',
        companyName: baseInput.companyName || 'Not specified',
      });

      onProgress('workflow', 'Starting AI workflow...', 15);

      const startTime = Date.now();
      scheduleProgressUpdates(onProgress, startTime);

      const providerResult = await resolveProvider(baseInput.userId, baseInput.modelId, 'resume');
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
        userId: baseInput.userId,
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

      const validatedResume = workflowResult.resume as Resume;

      const generatedResume = await saveGeneratedResume(
        this.repository,
        baseInput,
        validatedResume,
        { tokensUsed: workflowResult.tokensUsed },
        extractedJobTitle,
        extractedCompanyName
      );

      logger.info('Resume saved to database', { resumeId: generatedResume.id });

      invalidateResumesCache(baseInput.userId);

      onProgress('complete', 'Resume generated successfully!', 100);

      return success(buildGeneratedResumeResponse(generatedResume));
    } catch (error) {
      logger.error('Resume generation with progress error', error);
      onProgress('error', error instanceof Error ? error.message : 'Unknown error occurred', 0);
      return failure(error instanceof Error ? error.message : 'Unknown error occurred', 'INTERNAL_ERROR');
    }
  }

  async generateStandaloneCoverLetter(input: {
    userId: string;
    jobDescription: string;
    personalInstructions?: string;
    modelId?: string;
    profileId?: string;
  }): Promise<ServiceResult<CoverLetterGenerationData>> {
    try {
      logger.info('Starting standalone cover letter generation', { userId: input.userId });

      const resumeResult = await fetchAndValidateUserResume(input.userId, input.profileId);
      if (!resumeResult.success) {
        return failure(resumeResult.error, resumeResult.code);
      }
      const userResume = resumeResult.data;

      const providerResult = await resolveProvider(
        input.userId,
        input.modelId,
        'coverLetter' satisfies ResumeGenerationFeature
      );

      if (!providerResult.success) {
        return failure(providerResult.error, 'INTERNAL_ERROR');
      }

      const provider = providerResult.data.provider;
      const modelId = providerResult.data.modelId;

      logger.debug('Using AI model for cover letter', { modelId });

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
        companyName: coverLetterResult.companyName,
      });

      const { coverLetterService } = await import('@/lib/services/cover-letter.service');
      const coverLetterData = {
        userId: input.userId,
        content: coverLetterResult.content,
        jobDescription: input.jobDescription,
        jobTitle: coverLetterResult.jobTitle,
        companyName: coverLetterResult.companyName,
        metadata: {
          model: modelId,
          tokens: 0,
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
      return failure(
        error instanceof Error ? error.message : 'Failed to generate cover letter',
        'INTERNAL_ERROR'
      );
    }
  }
}

export const resumeGenerationService = new ResumeGenerationService();
