/**
 * Resume Optimization Agent
 * 
 * Optimizes resumes to match job requirements while preserving absolute truthfulness.
 * The profile/resume is the SINGLE SOURCE OF TRUTH - nothing is fabricated.
 */

import { z } from 'zod';
import type { LanguageModel } from 'ai';
import type { Resume } from '@/lib/validations/jsonresume';
import { ValidatedAIRunner } from '../../core/validated-runner';
import { PromptRegistry } from '../../prompts';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// Schema
// ============================================================================

/**
 * Optimized Resume Schema - validates the AI output
 * Uses passthrough() to preserve additional fields that the AI may return
 */
export const optimizedResumeSchema = z.object({
  basics: z.object({
    name: z.string().optional(),
    label: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    url: z.string().optional(),
    summary: z.string().optional(),
    location: z.object({
      city: z.string().optional(),
      countryCode: z.string().optional(),
      region: z.string().optional(),
      address: z.string().optional(),
      postalCode: z.string().optional(),
    }).passthrough().optional(),
    profiles: z.array(z.object({
      network: z.string().optional(),
      username: z.string().optional(),
      url: z.string().optional(),
    }).passthrough()).optional(),
  }).passthrough().optional(),
  work: z.array(z.object({
    name: z.string().optional(),
    position: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    summary: z.string().optional(),
    highlights: z.array(z.string()).optional(),
    url: z.string().optional(),
    location: z.string().optional(),
  }).passthrough()).optional(),
  education: z.array(z.object({
    institution: z.string().optional(),
    area: z.string().optional(),
    studyType: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    score: z.string().optional(),
    courses: z.array(z.string()).optional(),
  }).passthrough()).optional(),
  skills: z.array(z.object({
    name: z.string().optional(),
    level: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).passthrough()).optional(),
  projects: z.array(z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    highlights: z.array(z.string()).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    url: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).passthrough()).optional(),
  certificates: z.array(z.object({
    name: z.string().optional(),
    date: z.string().optional(),
    issuer: z.string().optional(),
    url: z.string().optional(),
  }).passthrough()).optional(),
  languages: z.array(z.object({
    language: z.string().optional(),
    fluency: z.string().optional(),
  }).passthrough()).optional(),
  volunteer: z.array(z.object({
    organization: z.string().optional(),
    position: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    summary: z.string().optional(),
    highlights: z.array(z.string()).optional(),
  }).passthrough()).optional(),
  awards: z.array(z.object({
    title: z.string().optional(),
    date: z.string().optional(),
    awarder: z.string().optional(),
    summary: z.string().optional(),
  }).passthrough()).optional(),
  publications: z.array(z.object({
    name: z.string().optional(),
    publisher: z.string().optional(),
    releaseDate: z.string().optional(),
    url: z.string().optional(),
    summary: z.string().optional(),
  }).passthrough()).optional(),
  interests: z.array(z.object({
    name: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).passthrough()).optional(),
  references: z.array(z.object({
    name: z.string().optional(),
    reference: z.string().optional(),
  }).passthrough()).optional(),
}).passthrough();

// ============================================================================
// Types
// ============================================================================

export type OptimizedResume = z.infer<typeof optimizedResumeSchema>;

export interface OptimizeResumeInput {
  model: LanguageModel;
  jobDescription: string;
  userResume: Resume;
}

export interface OptimizeResumeResult {
  resume: OptimizedResume;
  jobTitle: string;
  companyName: string;
}

// ============================================================================
// Agent
// ============================================================================

/**
 * Optimize a resume for a specific job
 * 
 * @param input - The optimization input
 * @returns The optimized resume with job metadata
 */
export async function optimizeResume(
  input: OptimizeResumeInput
): Promise<OptimizeResumeResult> {
  const { model } = input;

  logger.debug('Resume optimization started');
  
  const { system, prompt } = PromptRegistry.render('resume-optimization', {
    jobDescription: input.jobDescription,
    resume: JSON.stringify(input.userResume, null, 2),
  });

  const resultSchema = z.object({
    jobTitle: z.string(),
    companyName: z.string(),
    resume: optimizedResumeSchema,
  });

  const validatedResult = await ValidatedAIRunner.run({
    model,
    system,
    prompt,
    schema: resultSchema,
    userId: (input as any).userId,
    feature: 'resume-optimization',
  });

  return validatedResult;
}
