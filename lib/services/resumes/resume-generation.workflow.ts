import type { GeneratedResumeRepository } from '@/lib/repositories/generated-resumes.repository';
import type { GenerateResumeInput as GenerateResumeServiceInput, GenerateResumeWithProgressInput } from '@/lib/types';
import type { GeneratedResumeData as RepoGeneratedResumeData } from '@/lib/repositories/interfaces/generated-resumes.repository.interface';
import { CoreAgent } from '@/lib/ai/agent/core-agent';
import { validateResumeTool, extractJobMetadataTool, submitFinalResumeTool } from '@/lib/ai/tools/implementations/resume-tools';
import { resolveAIModelOrThrow } from '@/lib/ai/runtime';
import { success, failure, type ServiceResult } from '@/lib/types';
import { logger } from '@/lib/utils/logger';
import type { IProfileService, INotificationService } from '@/lib/services/types';
import type { Resume } from '@/lib/validations/jsonresume';

export async function runResumeGenerationWorkflow(
  repository: GeneratedResumeRepository,
  profileService: IProfileService,
  notificationService: INotificationService,
  input: GenerateResumeServiceInput
): Promise<ServiceResult<RepoGeneratedResumeData>> {
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

    const providerModel = resolvedModel.provider.createLanguageModel(resolvedModel.modelKey);

    const systemPrompt = `You are an AI orchestration agent specialized in resume optimization.
Your task is to generate a tailored resume for a specific job description based on the user's profile.
Rules:
1. You MUST NOT fabricate any information. Use ONLY the user's profile as the source of truth.
2. You MUST use the validateResumeTool to ensure your generated JSON matches the schema.
3. If validation fails, use the error messages to fix the issues and validate again.
4. You MUST use the extractJobMetadataTool to extract the job title and company name.
5. When everything is perfect and validated, you MUST call the submitFinalResumeTool to submit the final output.`;

    const userPrompt = `Job Description:
${input.jobDescription}

User Profile (Source of Truth):
${JSON.stringify(profileResult.data.resume, null, 2)}
`;

    const result = await CoreAgent.execute({
      model: providerModel,
      system: systemPrompt,
      prompt: userPrompt,
      tools: {
        validateResume: validateResumeTool,
        extractJobMetadata: extractJobMetadataTool,
        submitFinalResume: submitFinalResumeTool
      },
      maxSteps: 5,
    });

    // Extract the final result from the tool calls
    const finalSubmitCall = result.toolCalls.find(tc => tc.toolName === 'submitFinalResume');
    
    if (!finalSubmitCall) {
      return failure('Agent failed to complete the resume generation task', 'EXTERNAL_SERVICE_ERROR');
    }

    const { resume, jobTitle, companyName } = (finalSubmitCall as unknown as { args: { resume: Record<string, unknown>; jobTitle: string; companyName: string } }).args;

    // Persist the generated resume
    const saved = await repository.create({
      userId: input.userId,
      resume: resume as Resume,
      jobDescription: input.jobDescription,
      jobMetadata: {
          jobTitle: jobTitle || 'Optimized Resume',
          companyName: companyName || '',
      },
      templateId: input.templateId,
      metadata: {
        tokensUsed: result.usage?.totalTokens || 0,
        executionTime: 0, // Could measure this if needed
      }
    });

    return success(saved);
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
): Promise<ServiceResult<RepoGeneratedResumeData>> {
    // Basic implementation for now to satisfy types - onProgress is in input but not used yet
    return runResumeGenerationWorkflow(repository, profileService, notificationService, input);
}
