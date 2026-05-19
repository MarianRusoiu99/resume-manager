/**
 * Cover Letter Generation Agent
 * 
 * Generates personalized cover letters for job applications.
 * The user's profile is SINGLE SOURCE OF TRUTH - nothing is fabricated.
 */

import { z } from 'zod';
import { generateObject, type LanguageModel } from 'ai';
import type { Resume } from '@/lib/validations/jsonresume';
import { PromptRegistry } from '@/lib/ai/prompts';
import { logger } from '@/lib/utils/logger';

export type GenerateCoverLetterResult = {
  content: string;
  subject?: string;
  companyName?: string;
  recipientName?: string;
  jobTitle?: string;
}

export type GenerateCoverLetterInput = {
  model: LanguageModel;
  jobDescription: string;
  userResume: Resume;
  context?: string;
  userId?: string;
}

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

  const result = await generateObject({
    model,
    system,
    prompt,
    schema: z.object({
      content: z.string().describe('The full cover letter content'),
      subject: z.string().optional().describe('Email subject line for the cover letter'),
      recipientName: z.string().optional().describe('Name of recipient'),
      companyName: z.string().optional().describe('Company name'),
      jobTitle: z.string().optional().describe('Job title being applied for'),
    }),
  });

  return result.object;
}
