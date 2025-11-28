/**
 * Resume Optimization Agent - Execution Logic
 * 
 * Optimizes resumes to match job requirements
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import type { Resume } from '@/lib/validations/jsonresume';
import type { AIProvider } from '@/lib/ai/providers';
import { RESUME_OPTIMIZATION_SYSTEM_PROMPT, formatResumeOptimizationPrompt } from './index';
import type { JobAnalysisResult } from '../job-analysis/agent';

/**
 * Optimized Resume Schema - The final resume output
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
    }).optional(),
  }).optional(),
  work: z.array(z.object({
    name: z.string().optional(),
    position: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    summary: z.string().optional(),
    highlights: z.array(z.string()).optional(),
    url: z.string().optional(),
  })).optional(),
  education: z.array(z.object({
    institution: z.string().optional(),
    area: z.string().optional(),
    studyType: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    score: z.string().optional(),
  })).optional(),
  skills: z.array(z.object({
    name: z.string().optional(),
    level: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  })).optional(),
  projects: z.array(z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    highlights: z.array(z.string()).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    url: z.string().optional(),
  })).optional(),
});

export type OptimizedResume = z.infer<typeof optimizedResumeSchema>;

export interface OptimizeResumeInput {
  provider: AIProvider;
  modelId: string;
  jobAnalysis: JobAnalysisResult;
  userResume: Resume;
  personalInstructions?: string;
}

/**
 * Execute resume optimization agent
 * 
 * Optimizes a resume to match job requirements while maintaining authenticity.
 * Incorporates ATS keywords, emphasizes relevant experience, and tailors content.
 */
export async function optimizeResume(input: OptimizeResumeInput): Promise<OptimizedResume> {
  const model = input.provider.createLanguageModel(input.modelId);

  const result = await generateObject({
    model,
    schema: optimizedResumeSchema,
    system: RESUME_OPTIMIZATION_SYSTEM_PROMPT,
    prompt: formatResumeOptimizationPrompt({
      jobTitle: input.jobAnalysis.jobTitle,
      companyName: input.jobAnalysis.companyName,
      keyResponsibilities: input.jobAnalysis.keyResponsibilities,
      requiredSkills: input.jobAnalysis.requiredSkills,
      preferredSkills: input.jobAnalysis.preferredSkills,
      atsKeywords: input.jobAnalysis.atsKeywords,
      currentResume: input.userResume,
      personalInstructions: input.personalInstructions,
    }),
  });

  return result.object;
}
