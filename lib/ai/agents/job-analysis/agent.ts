/**
 * Job Analysis Agent - Execution Logic
 * 
 * Analyzes job descriptions and extracts structured information
 */

import { generateText } from 'ai';
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
 * Extract JSON from text response (handles markdown code blocks)
 */
function extractJSON(text: string): string {
  // Try to extract JSON from markdown code block
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  // If no code block, try to find JSON object directly
  const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    return jsonObjectMatch[0];
  }
  return text.trim();
}

/**
 * Execute job analysis agent
 * 
 * Analyzes a job description and extracts structured information including
 * required skills, preferred skills, ATS keywords, and key responsibilities.
 * 
 * Uses generateText with JSON parsing for broader model compatibility.
 */
export async function analyzeJob(input: AnalyzeJobInput): Promise<JobAnalysisResult> {
  const model = input.provider.createLanguageModel(input.modelId);
  
  const jsonInstructions = `
Respond with a JSON object in this exact format:
{
  "jobTitle": "the job title",
  "companyName": "the company name",
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill1", "skill2"],
  "atsKeywords": ["keyword1", "keyword2"],
  "keyResponsibilities": ["responsibility1", "responsibility2"],
  "summary": "brief summary of the role"
}

Only output valid JSON, no additional text.`;

  const result = await generateText({
    model,
    system: JOB_ANALYSIS_SYSTEM_PROMPT + jsonInstructions,
    prompt: formatSimpleJobAnalysisPrompt(input.jobDescription),
  });

  try {
    const jsonStr = extractJSON(result.text);
    const parsed = JSON.parse(jsonStr);
    return jobAnalysisSchema.parse(parsed);
  } catch (error) {
    // If parsing fails, return a default with extracted info
    console.error('Failed to parse job analysis response:', error);
    return {
      jobTitle: 'Position',
      companyName: 'Company',
      requiredSkills: [],
      preferredSkills: [],
      atsKeywords: [],
      keyResponsibilities: [],
      summary: 'Unable to analyze job description',
    };
  }
}
