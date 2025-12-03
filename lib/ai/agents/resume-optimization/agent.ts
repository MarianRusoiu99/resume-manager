/**
 * Resume Optimization Agent
 * 
 * Optimizes resumes to match job requirements while preserving absolute truthfulness.
 * The profile/resume is the SINGLE SOURCE OF TRUTH - nothing is fabricated.
 */

import { generateText } from 'ai';
import { z } from 'zod';
import type { Resume } from '@/lib/validations/jsonresume';
import type { AIProvider } from '@/lib/ai/providers';
import { extractJSON } from '../shared/utils';
import { 
  RESUME_OPTIMIZATION_SYSTEM_PROMPT, 
  buildResumeOptimizationPrompt 
} from './prompt';

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
  provider: AIProvider;
  modelId: string;
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
  const model = input.provider.createLanguageModel(input.modelId);

  console.log('🔧 Resume optimization started');
  console.log('   Job description length:', input.jobDescription?.length || 0);
  console.log('   Job description preview:', input.jobDescription?.slice(0, 200) || 'EMPTY');

  const prompt = buildResumeOptimizationPrompt(input.jobDescription, input.userResume);
  console.log('   Prompt length:', prompt.length);

  const result = await generateText({
    model,
    system: RESUME_OPTIMIZATION_SYSTEM_PROMPT,
    prompt,
  });

  console.log('🤖 AI response received');
  console.log('   Response length:', result.text.length);
  console.log('   Response preview:', result.text.slice(0, 500));

  try {
    const jsonStr = extractJSON(result.text);
    console.log('   Extracted JSON length:', jsonStr.length);
    
    const parsed = JSON.parse(jsonStr);
    console.log('   Parsed object keys:', Object.keys(parsed));
    
    // Extract metadata
    const jobTitle = parsed.jobTitle || 'Position';
    const companyName = parsed.companyName || 'Company';
    console.log('   Extracted job title:', jobTitle);
    console.log('   Extracted company:', companyName);
    
    // Parse and validate the resume
    const resume = optimizedResumeSchema.parse(parsed.resume || parsed);
    console.log('   Resume sections:', Object.keys(resume));
    
    return { resume, jobTitle, companyName };
  } catch (error) {
    // Fallback: return original resume structure if parsing fails
    console.error('Failed to parse optimized resume:', error);
    return {
      resume: {
        basics: input.userResume.basics,
        work: input.userResume.work,
        education: input.userResume.education,
        skills: input.userResume.skills,
        projects: input.userResume.projects,
      } as OptimizedResume,
      jobTitle: 'Position',
      companyName: 'Company',
    };
  }
}
