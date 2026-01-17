import type { GeneratedResumeRepository } from '@/lib/repositories/generated-resumes.repository';

import type { Resume } from '@/lib/validations/jsonresume';

import type { GenerateResumeServiceInput } from '@/lib/types';

export async function saveGeneratedResume(
  repository: GeneratedResumeRepository,
  input: GenerateResumeServiceInput,
  validatedResume: Resume,
  workflowResult: { tokensUsed?: number },
  extractedJobTitle: string,
  extractedCompanyName: string
) {
  return repository.create({
    userId: input.userId,
    jobDescription: input.jobDescription,
    jobMetadata: {
      jobTitle: extractedJobTitle,
      companyName: extractedCompanyName,
    },
    templateId: input.templateId ?? undefined,
    resume: validatedResume,
    metadata: {
      model: validatedResume.meta?.model || 'unknown',
      totalTokens: workflowResult.tokensUsed || 0,
      generatedAt: validatedResume.meta?.lastModified || new Date().toISOString(),
    },
  });
}

export function buildGeneratedResumeResponse(generatedResume: {
  id: string;
  resume: unknown;
  metadata: unknown;
  createdAt: Date;
}) {
  return {
    resumeId: generatedResume.id,
    resume: {
      id: generatedResume.id,
      content: generatedResume.resume as Record<string, unknown>,
      metadata: generatedResume.metadata as Record<string, unknown>,
      createdAt: generatedResume.createdAt,
    },
  };
}
