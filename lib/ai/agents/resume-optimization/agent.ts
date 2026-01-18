/**
 * Resume Optimization Agent
 * 
 * Optimizes resumes to match job requirements while preserving absolute truthfulness.
 * The profile/resume is the SINGLE SOURCE OF TRUTH - nothing is fabricated.
 */

import { z } from 'zod';
import type { LanguageModel } from 'ai';
import { ValidatedAIRunner } from '@/lib/ai/core/validated-runner';
import { StreamAIRunner } from '@/lib/ai/core/stream-runner';
import { PromptRegistry } from '@/lib/ai/prompts';
import { logger } from '@/lib/utils/logger';
import { resumeSchema } from '@/lib/validations/jsonresume/schema';
import type { Resume } from '@/lib/validations/jsonresume/schema';

export interface OptimizeResumeInput {
  model: LanguageModel;
  jobDescription: string;
  userResume: Resume;
  userId?: string;
}

export interface OptimizeResumeResult {
  resume: Resume;
  jobTitle: string;
  companyName: string;
}

const resultSchema = z.object({
  jobTitle: z.string(),
  companyName: z.string(),
  resume: resumeSchema,
});

export async function optimizeResume(
  input: OptimizeResumeInput
): Promise<OptimizeResumeResult> {
  const { model } = input;

  logger.debug('Resume optimization started');
  
  const { system, prompt } = PromptRegistry.render('resume-optimization', {
    jobDescription: input.jobDescription,
    resume: JSON.stringify(input.userResume, null, 2),
  });

  return ValidatedAIRunner.run({
    model,
    system,
    prompt,
    schema: resultSchema,
    userId: input.userId,
    feature: 'resume-optimization',
  });
}

export function streamOptimizeResume(input: OptimizeResumeInput) {
  const { model } = input;

  const { system, prompt } = PromptRegistry.render('resume-optimization', {
    jobDescription: input.jobDescription,
    resume: JSON.stringify(input.userResume, null, 2),
  });

  return StreamAIRunner.stream({
    model,
    system,
    prompt,
    schema: resultSchema,
    userId: input.userId,
    feature: 'resume-optimization',
  });
}
