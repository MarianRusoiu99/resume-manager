import type { GeneratedResumeRepository } from '@/lib/repositories/generated-resumes.repository';
import type { GenerateResumeServiceInput, GenerateResumeWithProgressInput, GeneratedResumeData } from './types';
import { generateResume as runAIWorkflow } from '@/lib/ai/workflow/resume-generation';
import { resolveAIModelOrThrow } from '@/lib/ai/runtime';
import { success, failure, type ServiceResult } from '@/lib/types/service-result';
import { logger } from '@/lib/utils/logger';
import type { IProfileService, INotificationService } from '../../interfaces';
import type { Resume } from '@/lib/validations/jsonresume';

export async function runResumeGenerationWorkflow(
  repository: GeneratedResumeRepository,
  profileService: IProfileService,
  notificationService: INotificationService,
  input: GenerateResumeServiceInput
): Promise<ServiceResult<GeneratedResumeData>> {
  try {
    // Get the user's default profile or a specific profile
    let profileResult;
    if (input.profileId) {
        profileResult = await profileService.getProfileById(input.profileId, input.userId);
    } else {
        profileResult = await profileService.getProfile(input.userId);
    }

    if (!profileResult.success || !profileResult.data) {
      return failure('User profile not found. Please create a profile first.', 'NOT_FOUND');
    }

    const resolvedModel = await resolveAIModelOrThrow({
      userId: input.userId,
      feature: 'resume',
      modelId: input.modelId,
    });

    const result = await runAIWorkflow({
      provider: resolvedModel.provider,
      modelKey: resolvedModel.modelKey,
      jobDescription: input.jobDescription,
      userResume: profileResult.data.resume as Resume,
      userId: input.userId,
    });

    if (!result.success || !result.resume) {
      return failure(result.error || 'Generation failed', 'EXTERNAL_SERVICE_ERROR');
    }

    // Persist the generated resume
    const saved = await repository.create({
      userId: input.userId,
      resume: result.resume as Resume,
      jobDescription: input.jobDescription,
      jobMetadata: {
          jobTitle: result.jobTitle || 'Optimized Resume',
          companyName: result.companyName || '',
      },
      templateId: input.templateId,
      metadata: {
        tokensUsed: result.tokensUsed || 0,
        executionTime: result.executionTime || 0,
      }
    });

    // Notify user that resume is ready
    await notificationService.notifyResumeGenerated(
      input.userId,
      saved.id,
      result.jobTitle,
      result.companyName
    );

    return success({
      resumeId: saved.id,
      resume: {
        id: saved.id,
        content: result.resume,
        metadata: {
          jobTitle: result.jobTitle,
          companyName: result.companyName,
        },
        createdAt: new Date(),
      },
    } as GeneratedResumeData);
  } catch (error) {
    logger.error('Error in resume generation workflow', error as Error);
    return failure('An unexpected error occurred during generation', 'INTERNAL_ERROR');
  }
}

export async function runResumeGenerationWorkflowWithProgress(
  repository: GeneratedResumeRepository,
  profileService: IProfileService,
  notificationService: INotificationService,
  input: GenerateResumeWithProgressInput
): Promise<ServiceResult<GeneratedResumeData>> {
    // Basic implementation for now to satisfy types - onProgress is in input but not used yet
    return runResumeGenerationWorkflow(repository, profileService, notificationService, input);
}

export async function runStandaloneCoverLetterWorkflow(_input: Record<string, unknown>): Promise<ServiceResult<never>> {
    return failure('Cover letter generation not implemented in this workflow', 'INTERNAL_ERROR');
}
