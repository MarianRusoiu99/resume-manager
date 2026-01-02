/**
 * Cover Letter Generation Agent
 * 
 * Generates personalized cover letters for job applications.
 * The user's profile is the SINGLE SOURCE OF TRUTH - nothing is fabricated.
 */

import { z } from 'zod';
import type { LanguageModel } from 'ai';
import type { Resume } from '@/lib/validations/jsonresume';
import { ValidatedAIRunner } from '../../core/validated-runner';
import { PromptRegistry } from '../../prompts';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface GenerateCoverLetterInput {
  model: LanguageModel;
  jobDescription: string;
  userResume: Resume;
  context?: string;
  userId?: string;
}

export interface GenerateCoverLetterResult {
  content: string;
  subject: string;
  jobTitle: string;
  companyName: string;
  recipientName: string;
}

// ============================================================================
// Agent
// ============================================================================

/**
 * Generate a cover letter for a specific job
 * 
 * @param input - The generation input
 * @returns The generated cover letter with job metadata
 */
export async function generateCoverLetter(
  input: GenerateCoverLetterInput
): Promise<GenerateCoverLetterResult> {
  const { model } = input;

  logger.debug('Cover letter generation started');

  const { system, prompt } = PromptRegistry.render('cover-letter-generation', {
    jobDescription: input.jobDescription,
    resume: JSON.stringify(input.userResume, null, 2),
    context: input.context || 'None provided',
  });

  const resultSchema = z.object({
    subject: z.string(),
    content: z.string(),
    recipientName: z.string(),
    companyName: z.string(),
  });

  const validatedResult = await ValidatedAIRunner.run({
    model,
    system,
    prompt,
    schema: resultSchema,
    userId: input.userId,
    feature: 'cover-letter-generation',
  });

  return {
    ...validatedResult,
    jobTitle: 'Position', // We could add this to the prompt if needed
  };
}
