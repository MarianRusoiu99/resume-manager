import { type Tool } from 'ai';
import { z } from 'zod';
import { resumeSchema } from '@/lib/validations/jsonresume';

export const validateResumeTool: Tool = {
  description: 'Validates a generated resume against the ResumeSchema to ensure all required fields are present and correctly typed.',
  parameters: z.object({
    resume: z.record(z.string(), z.unknown()).describe('The resume object to validate'),
  }),
  execute: async ({ resume }: { resume: Record<string, unknown> }) => {
    try {
      resumeSchema.parse(resume);
      return { success: true, message: 'Resume format is valid.' };
    } catch (error: unknown) {
      return { success: false, errors: error };
    }
  },
} as unknown as Tool;

export const extractJobMetadataTool: Tool = {
  description: 'Extracts the job title and company name from a raw job description.',
  parameters: z.object({
    jobTitle: z.string().describe('The extracted job title'),
    companyName: z.string().describe('The extracted company name'),
  }),
  execute: async (params: { jobTitle: string; companyName: string }) => {
    return params;
  },
} as unknown as Tool;

export const submitFinalResumeTool: Tool = {
  description: 'Submits the final optimized resume and job metadata. ALWAYS call this tool when you are done validating and optimizing.',
  parameters: z.object({
    resume: resumeSchema.describe('The final validated JSON resume'),
    jobTitle: z.string().describe('The extracted job title'),
    companyName: z.string().describe('The extracted company name'),
  }),
  execute: async (params: { resume: z.infer<typeof resumeSchema>; jobTitle: string; companyName: string }) => {
    return { success: true, ...params };
  },
} as unknown as Tool;


