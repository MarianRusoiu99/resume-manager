/**
 * Cover Letter Agent - Execution Logic
 * 
 * Generates personalized cover letters for job applications
 */

import { generateText } from 'ai';
import { z } from 'zod';
import type { Resume } from '@/lib/validations/jsonresume';
import type { AIProvider } from '@/lib/ai/providers';
import { COVER_LETTER_SYSTEM_PROMPT, formatCoverLetterPrompt } from './index';
import type { JobAnalysisResult } from '../job-analysis/agent';
import type { OptimizedResume } from '../resume-optimization/agent';

/**
 * Cover Letter Schema
 */
export const coverLetterSchema = z.object({
  content: z.string().describe('The full cover letter content in markdown format'),
  tone: z.string().describe('The tone of the cover letter (professional, enthusiastic, etc.)'),
});

export type CoverLetterResult = z.infer<typeof coverLetterSchema>;

export interface GenerateCoverLetterInput {
  provider: AIProvider;
  modelId: string;
  jobAnalysis: JobAnalysisResult;
  userResume: Resume;
  optimizedResume: OptimizedResume;
}

/**
 * Execute cover letter generation agent
 * 
 * Generates a personalized cover letter that connects the candidate's
 * experience to the job requirements in a compelling narrative.
 * 
 * Uses generateText instead of generateObject for broader model compatibility
 * (GPT-4 doesn't support json_schema response format).
 */
export async function generateCoverLetter(input: GenerateCoverLetterInput): Promise<CoverLetterResult> {
  const model = input.provider.createLanguageModel(input.modelId);
  const userName = input.userResume.basics?.name || input.optimizedResume.basics?.name || 'Applicant';

  const result = await generateText({
    model,
    system: COVER_LETTER_SYSTEM_PROMPT,
    prompt: formatCoverLetterPrompt({
      applicantName: userName,
      jobTitle: input.jobAnalysis.jobTitle,
      companyName: input.jobAnalysis.companyName,
      jobSummary: input.jobAnalysis.summary,
      keyResponsibilities: input.jobAnalysis.keyResponsibilities,
      optimizedResume: input.optimizedResume,
    }),
  });

  // Return the generated text as the cover letter content
  return {
    content: result.text.trim(),
    tone: 'professional', // Default tone since we're using text generation
  };
}
