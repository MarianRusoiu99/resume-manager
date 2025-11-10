/**
 * Simple Resume Generator using Vercel AI SDK
 * 
 * A streamlined workflow for resume generation with structured outputs
 */

import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { Resume } from '@/lib/validations/jsonresume';

// ============================================================================
// Schemas for Structured Outputs
// ============================================================================

/**
 * Job Analysis Schema - Extract key info from job description
 */
const jobAnalysisSchema = z.object({
  jobTitle: z.string().describe('The job title from the description'),
  companyName: z.string().describe('The company name from the description'),
  requiredSkills: z.array(z.string()).describe('Must-have skills and qualifications'),
  preferredSkills: z.array(z.string()).describe('Nice-to-have skills'),
  atsKeywords: z.array(z.string()).describe('Keywords for ATS optimization'),
  keyResponsibilities: z.array(z.string()).describe('Main job responsibilities'),
  summary: z.string().describe('Brief summary of the role'),
});

/**
 * Optimized Resume Schema - The final resume output
 */
const optimizedResumeSchema = z.object({
  basics: z.object({
    name: z.string(),
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
  }),
  work: z.array(z.object({
    name: z.string(),
    position: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    summary: z.string().optional(),
    highlights: z.array(z.string()).optional(),
    url: z.string().optional(),
  })).optional(),
  education: z.array(z.object({
    institution: z.string(),
    area: z.string().optional(),
    studyType: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    score: z.string().optional(),
  })).optional(),
  skills: z.array(z.object({
    name: z.string(),
    level: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  })).optional(),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    highlights: z.array(z.string()).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    url: z.string().optional(),
  })).optional(),
});

/**
 * Cover Letter Schema
 */
const coverLetterSchema = z.object({
  content: z.string().describe('The full cover letter content in markdown format'),
  tone: z.string().describe('The tone of the cover letter (professional, enthusiastic, etc.)'),
});

// ============================================================================
// Types
// ============================================================================

export type JobAnalysisResult = z.infer<typeof jobAnalysisSchema>;
export type OptimizedResume = z.infer<typeof optimizedResumeSchema>;
export type CoverLetterResult = z.infer<typeof coverLetterSchema>;

export interface GenerateResumeInput {
  apiKey: string;
  jobDescription: string;
  userResume: Resume;
  includeCoverLetter?: boolean;
  personalInstructions?: string;
}

export interface GenerateResumeResult {
  success: boolean;
  resume?: Resume;
  coverLetter?: string;
  error?: string;
  tokensUsed?: number;
}

// ============================================================================
// AI Workflow Functions
// ============================================================================

/**
 * Step 1: Analyze the job description
 */
async function analyzeJob(
  apiKey: string,
  jobDescription: string
): Promise<JobAnalysisResult> {
  const openai = createOpenAI({ apiKey });
  
  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: jobAnalysisSchema,
    prompt: `Analyze this job description and extract structured information:

${jobDescription}

Extract the job title, company name, required skills, preferred skills, ATS keywords, key responsibilities, and a brief summary.`,
  });

  return result.object;
}

/**
 * Step 2: Generate optimized resume
 */
async function generateOptimizedResume(
  apiKey: string,
  jobAnalysis: JobAnalysisResult,
  userResume: Resume,
  personalInstructions?: string
): Promise<OptimizedResume> {
  const openai = createOpenAI({ apiKey });
  
  const result = await generateObject({
    model: openai('gpt-4o'),
    schema: optimizedResumeSchema,
    prompt: `You are an expert resume writer. Optimize this resume for the job description.

JOB DETAILS:
- Job Title: ${jobAnalysis.jobTitle}
- Company: ${jobAnalysis.companyName}
- Required Skills: ${jobAnalysis.requiredSkills.join(', ')}
- Key Responsibilities: ${jobAnalysis.keyResponsibilities.join('; ')}
- ATS Keywords: ${jobAnalysis.atsKeywords.join(', ')}

CURRENT RESUME:
${JSON.stringify(userResume, null, 2)}

${personalInstructions ? `SPECIAL INSTRUCTIONS:\n${personalInstructions}\n` : ''}

INSTRUCTIONS:
1. Tailor the resume to match the job requirements
2. Incorporate ATS keywords naturally throughout
3. Highlight relevant experience and skills
4. Rewrite work highlights to emphasize achievements relevant to this role
5. Update the professional summary to align with the job
6. Keep all personal information (name, contact details) from the original resume
7. Maintain the same structure but optimize content for this specific job

Generate an optimized resume that will pass ATS systems and appeal to hiring managers.`,
  });

  return result.object;
}

/**
 * Step 3: Generate cover letter (optional)
 */
async function generateCoverLetter(
  apiKey: string,
  jobAnalysis: JobAnalysisResult,
  userResume: Resume,
  optimizedResume: OptimizedResume
): Promise<CoverLetterResult> {
  const openai = createOpenAI({ apiKey });
  const userName = userResume.basics?.name || optimizedResume.basics.name || 'Applicant';
  
  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: coverLetterSchema,
    prompt: `Write a compelling cover letter for this job application.

APPLICANT: ${userName}

JOB DETAILS:
- Job Title: ${jobAnalysis.jobTitle}
- Company: ${jobAnalysis.companyName}
- Summary: ${jobAnalysis.summary}
- Key Responsibilities: ${jobAnalysis.keyResponsibilities.join('; ')}

APPLICANT'S BACKGROUND:
${JSON.stringify(optimizedResume, null, 2)}

INSTRUCTIONS:
1. Write a professional, engaging cover letter in markdown format
2. Highlight how the applicant's experience matches the job requirements
3. Show enthusiasm for the role and company
4. Keep it concise (3-4 paragraphs)
5. Use a professional but warm tone
6. Include specific examples from their experience

Generate the cover letter content in markdown format.`,
  });

  return result.object;
}

// ============================================================================
// Main Workflow
// ============================================================================

/**
 * Generate an optimized resume (and optionally a cover letter)
 * 
 * This is the main entry point that orchestrates the entire workflow:
 * 1. Analyze job description
 * 2. Generate optimized resume
 * 3. Generate cover letter (if requested)
 */
export async function generateResume(
  input: GenerateResumeInput
): Promise<GenerateResumeResult> {
  try {
    console.log('🚀 Starting resume generation workflow');

    // Step 1: Analyze the job
    console.log('🔍 Step 1: Analyzing job description...');
    const jobAnalysis = await analyzeJob(input.apiKey, input.jobDescription);
    console.log(`   ✓ Found job: ${jobAnalysis.jobTitle} at ${jobAnalysis.companyName}`);

    // Step 2: Generate optimized resume
    console.log('✨ Step 2: Generating optimized resume...');
    const optimizedResume = await generateOptimizedResume(
      input.apiKey,
      jobAnalysis,
      input.userResume,
      input.personalInstructions
    );
    console.log('   ✓ Resume optimized');

    // Step 3: Generate cover letter (if requested)
    let coverLetter: string | undefined;
    if (input.includeCoverLetter) {
      console.log('📝 Step 3: Generating cover letter...');
      const coverLetterResult = await generateCoverLetter(
        input.apiKey,
        jobAnalysis,
        input.userResume,
        optimizedResume
      );
      coverLetter = coverLetterResult.content;
      console.log('   ✓ Cover letter generated');
    }

    console.log('✅ Resume generation complete!');

    return {
      success: true,
      resume: optimizedResume as Resume,
      coverLetter,
    };
  } catch (error) {
    console.error('❌ Resume generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
