import { generateResume } from '@/lib/ai';
import { coverLetterRepository } from '@/lib/repositories';
import type { CreateCoverLetterInput } from '@/lib/repositories/interfaces';
import { logger } from '@/lib/utils/logger';
import { failure, success, type ServiceResult } from '@/lib/types/service-result';
import type { Resume } from '@/lib/validations/jsonresume';

import { invalidateResumesCache } from './cache';
import { saveGeneratedResume, buildGeneratedResumeResponse } from './persistence';
import { fetchAndValidateUserResume } from './profile';
import { scheduleProgressUpdates } from './progress';
import { resolveAIModel } from '@/lib/ai/runtime';
import type { AIFeatureType } from '@/lib/services/user-ai-settings';
import type {
  CoverLetterGenerationData,
  GeneratedResumeData,
  GenerateResumeServiceInput,
  GenerateResumeWithProgressInput,
} from './types';
import type { GeneratedResumeRepository } from '@/lib/repositories/generated-resume.repository';

export async function runResumeGenerationWorkflow(
  repository: GeneratedResumeRepository,
  input: GenerateResumeServiceInput
): Promise<ServiceResult<GeneratedResumeData>> {
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

    const providerResult = await resolveAIModel({
      userId: input.userId,
      modelId: input.modelId,
      feature: 'resume' satisfies AIFeatureType,
    });
    if (!providerResult.success) {
      return failure(providerResult.error, 'INTERNAL_ERROR');
    }

    const workflowResult = await generateResume({
      provider: providerResult.data.provider,
      modelKey: providerResult.data.modelKey,
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
      repository,
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

export async function runResumeGenerationWorkflowWithProgress(
  repository: GeneratedResumeRepository,
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

    const providerResult = await resolveAIModel({
      userId: baseInput.userId,
      modelId: baseInput.modelId,
      feature: 'resume' satisfies AIFeatureType,
    });
    if (!providerResult.success) {
      return failure(providerResult.error, providerResult.code);
    }

    const provider = providerResult.data.provider;
    const { modelId, modelKey } = providerResult.data;
    logger.info('Using AI provider', { providerType: providerResult.data.providerType, modelId });

    const workflowResult = await generateResume({
      provider,
      modelKey,
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
      repository,
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

export async function runStandaloneCoverLetterWorkflow(input: {
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

    const providerResult = await resolveAIModel({
      userId: input.userId,
      modelId: input.modelId,
      feature: 'coverLetter' satisfies AIFeatureType,
    });

    if (!providerResult.success) {
      return failure(providerResult.error, 'INTERNAL_ERROR');
    }

    const provider = providerResult.data.provider;
    const modelKey = providerResult.data.modelKey;

    logger.debug('Using AI model for cover letter', {
      modelId: providerResult.data.modelId,
      modelKey,
    });

    const { generateCoverLetter } = await import('@/lib/ai/agents');
    const coverLetterResult = await generateCoverLetter({
      model: provider.createLanguageModel(modelKey),
      jobDescription: input.jobDescription,
      userResume,
    });

    logger.debug('Cover letter generated', {
      length: coverLetterResult.content.length,
      jobTitle: coverLetterResult.jobTitle,
      companyName: coverLetterResult.companyName,
    });

    const coverLetterData: CreateCoverLetterInput = {
      userId: input.userId,
      content: coverLetterResult.content,
      metadata: {
        model: modelKey,
        tokens: 0,
        generationTime: 0,
        personalInstructions: input.personalInstructions,
        jobDescription: input.jobDescription,
        jobTitle: coverLetterResult.jobTitle,
        companyName: coverLetterResult.companyName,
      },
    };

    const savedCoverLetter = await coverLetterRepository.create(coverLetterData);

    logger.info('Cover letter saved', { coverLetterId: savedCoverLetter.id });

    return success({
      coverLetterId: savedCoverLetter.id,
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
