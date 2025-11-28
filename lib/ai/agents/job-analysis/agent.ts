/**
 * Job Analysis Agent - Execution Logic
 * 
 * Analyzes job descriptions and extracts structured information
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import type { AIProvider } from '@/lib/ai/providers';
import { JOB_ANALYSIS_SYSTEM_PROMPT, formatSimpleJobAnalysisPrompt } from './index';

/**
 * Job Analysis Schema - Extract key info from job description
 */
export const jobAnalysisSchema = z.object({
  jobTitle: z.string().describe('The job title from the description'),
  companyName: z.string().describe('The company name from the description'),
  requiredSkills: z.array(z.string()).describe('Must-have skills and qualifications'),
  preferredSkills: z.array(z.string()).describe('Nice-to-have skills'),
  atsKeywords: z.array(z.string()).describe('Keywords for ATS optimization'),
  keyResponsibilities: z.array(z.string()).describe('Main job responsibilities'),
  summary: z.string().describe('Brief summary of the role'),
});

export type JobAnalysisResult = z.infer<typeof jobAnalysisSchema>;

export interface AnalyzeJobInput {
  provider: AIProvider;
  modelId: string;
  jobDescription: string;
}

/**
 * Execute job analysis agent
 * 
 * Analyzes a job description and extracts structured information including
 * required skills, preferred skills, ATS keywords, and key responsibilities.
 */
export async function analyzeJob(input: AnalyzeJobInput): Promise<JobAnalysisResult> {
  const model = input.provider.createLanguageModel(input.modelId);
  
  const result = await generateObject({
    model,
    schema: jobAnalysisSchema,
    system: JOB_ANALYSIS_SYSTEM_PROMPT,
    prompt: formatSimpleJobAnalysisPrompt(input.jobDescription),
  });

  return result.object;
}
