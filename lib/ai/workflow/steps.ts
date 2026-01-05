/**
 * Predefined Workflow Steps
 * 
 * Reusable steps that can be composed into workflows
 */

import type { WorkflowStep, WorkflowContext, WorkflowResults } from './types';
import { ValidationError } from "@/lib/errors";
import type { Resume } from '@/lib/validations/jsonresume';

/**
 * Step: Optimize Resume
 * 
 * Optimizes the user's resume for the target job.
 * Extracts job title and company name inline.
 */
export const optimizeResumeStep: WorkflowStep = {
  id: 'optimize-resume',
  name: 'Resume Optimization',
  description: 'Optimizing resume for target job...',
  progressStart: 20,
  progressEnd: 80,
  execute: async (context: WorkflowContext): Promise<Partial<WorkflowResults>> => {
    const { optimizeResume } = await import('@/lib/ai/agents');
    
    const result = await optimizeResume({
      model: context.provider.createLanguageModel(context.modelKey),
      jobDescription: context.jobDescription,
      userResume: context.userResume,
    });

    return {
      resume: result.resume as Resume,
      jobTitle: result.jobTitle,
      companyName: result.companyName,
    };
  },
};

/**
 * Step: Generate Cover Letter
 * 
 * Generates a cover letter based on the job description and resume.
 */
export const generateCoverLetterStep: WorkflowStep = {
  id: 'generate-cover-letter',
  name: 'Cover Letter Generation',
  description: 'Generating cover letter...',
  progressStart: 20,
  progressEnd: 80,
  execute: async (context: WorkflowContext): Promise<Partial<WorkflowResults>> => {
    const { generateCoverLetter } = await import('@/lib/ai/agents');
    
    const result = await generateCoverLetter({
      model: context.provider.createLanguageModel(context.modelKey),
      jobDescription: context.jobDescription,
      userResume: context.userResume,
    });

    return {
      coverLetter: result.content,
      jobTitle: result.jobTitle,
      companyName: result.companyName,
    };
  },
};

/**
 * Step: Validate Resume
 * 
 * Validates the generated resume against JSON Resume schema.
 */
export const validateResumeStep: WorkflowStep = {
  id: 'validate-resume',
  name: 'Resume Validation',
  description: 'Validating resume format...',
  progressStart: 80,
  progressEnd: 90,
  execute: async (context: WorkflowContext): Promise<Partial<WorkflowResults>> => {
    const { resumeSchema } = await import('@/lib/validations/jsonresume');
    
    if (!context.results.resume) {
      throw new ValidationError('No resume to validate');
    }

    // Validate against schema
    const validated = resumeSchema.parse(context.results.resume);
    
    return {
      resume: validated,
      validated: true,
    };
  },
  shouldSkip: (context) => !context.results.resume,
};

/**
 * Step: Extract Job Metadata (Optional)
 * 
 * Extracts job title and company name if not already present.
 * This is a lightweight extraction without full job analysis.
 */
export const extractJobMetadataStep: WorkflowStep = {
  id: 'extract-metadata',
  name: 'Job Metadata Extraction',
  description: 'Extracting job details...',
  progressStart: 5,
  progressEnd: 15,
  execute: async (context: WorkflowContext): Promise<Partial<WorkflowResults>> => {
    const { generateText } = await import('ai');
    
    const model = context.provider.createLanguageModel(context.modelKey);
    
    const result = await generateText({
      model,
      system: 'Extract the job title and company name from the job description. Return JSON: {"jobTitle": "...", "companyName": "..."}',
      prompt: context.jobDescription.slice(0, 2000), // Limit input size
    });

    try {
      const match = result.text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          jobTitle: parsed.jobTitle || 'Position',
          companyName: parsed.companyName || 'Company',
        };
      }
    } catch {
      // Fallback if parsing fails
    }

    return {
      jobTitle: 'Position',
      companyName: 'Company',
    };
  },
  // Skip if we already have job metadata
  shouldSkip: (context) => !!(context.results.jobTitle && context.results.companyName),
};

/**
 * All available steps
 */
export const availableSteps = {
  optimizeResume: optimizeResumeStep,
  generateCoverLetter: generateCoverLetterStep,
  validateResume: validateResumeStep,
  extractJobMetadata: extractJobMetadataStep,
} as const;

export type StepId = keyof typeof availableSteps;
