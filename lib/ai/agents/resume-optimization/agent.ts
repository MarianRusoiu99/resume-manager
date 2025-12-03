/**
 * Resume Optimization Agent - Execution Logic
 * 
 * Optimizes resumes to match job requirements
 */

import { generateText } from 'ai';
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
 * Execute resume optimization agent
 * 
 * Optimizes a resume to match job requirements while maintaining authenticity.
 * Incorporates ATS keywords, emphasizes relevant experience, and tailors content.
 * 
 * Uses generateText with JSON parsing for broader model compatibility.
 */
export async function optimizeResume(input: OptimizeResumeInput): Promise<OptimizedResume> {
  const model = input.provider.createLanguageModel(input.modelId);

  const jsonInstructions = `
Respond with a JSON object representing an optimized resume in JSON Resume format.
Include these sections: basics (with name, label, email, phone, summary, location), work (array of positions), education (array), skills (array with name and keywords), projects (array, optional).

Only output valid JSON, no additional text or explanation.`;

  const result = await generateText({
    model,
    system: RESUME_OPTIMIZATION_SYSTEM_PROMPT + jsonInstructions,
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

  try {
    const jsonStr = extractJSON(result.text);
    const parsed = JSON.parse(jsonStr);
    return optimizedResumeSchema.parse(parsed);
  } catch (error) {
    // If parsing fails, return the user's original resume structure
    console.error('Failed to parse optimized resume response:', error);
    return {
      basics: input.userResume.basics,
      work: input.userResume.work,
      education: input.userResume.education,
      skills: input.userResume.skills,
      projects: input.userResume.projects,
    } as OptimizedResume;
  }
}
