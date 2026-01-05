/**
 * AI Output Schemas
 *
 * Zod schemas for AI-generated outputs
 */

import { z } from 'zod';
import { resumeSchema } from '@/lib/validations/jsonresume';

/**
 * Resume generation output schema
 */
export const resumeGenerationOutputSchema = z.object({
  resume: resumeSchema,
  jobTitle: z.string().describe('The job title extracted from the job description'),
  companyName: z.string().describe('The company name extracted from the job description'),
  matchScore: z.number().min(0).max(100).optional().describe('How well the resume matches the job requirements (0-100)'),
  suggestions: z.array(z.string()).optional().describe('Suggestions for further improving the resume'),
});

export type ResumeGenerationOutput = z.infer<typeof resumeGenerationOutputSchema>;

/**
 * Resume enhancement output schema
 */
export const resumeEnhancementOutputSchema = z.object({
  resume: resumeSchema,
  changes: z.array(z.string()).optional().describe('List of changes made to the resume'),
});

export type ResumeEnhancementOutput = z.infer<typeof resumeEnhancementOutputSchema>;

/**
 * Cover letter generation output schema
 */
export const coverLetterOutputSchema = z.object({
  content: z.string().describe('The full cover letter content'),
  subject: z.string().optional().describe('Email subject line for the cover letter'),
  recipientName: z.string().optional().describe('Name of recipient'),
  companyName: z.string().optional().describe('Company name'),
  jobTitle: z.string().optional().describe('Job title being applied for'),
});

export type CoverLetterOutput = z.infer<typeof coverLetterOutputSchema>;

export type GenerateCoverLetterResult = CoverLetterOutput & {
  jobTitle: string;
};

/**
 * Template generation output schema
 */
export const templateGenerationOutputSchema = z.object({
  htmlTemplate: z.string().describe('The HTML template with Handlebars placeholders and inline <style> blocks'),
  name: z.string().optional().describe('Suggested name for the template'),
  description: z.string().optional().describe('Description of the template'),
});

export type TemplateGenerationOutput = z.infer<typeof templateGenerationOutputSchema>;

/**
 * Template enhancement output schema
 */
export const templateEnhancementOutputSchema = z.object({
  htmlTemplate: z.string().describe('The enhanced HTML template with inline <style> blocks'),
  changes: z.array(z.string()).optional().describe('List of changes made'),
});

export type TemplateEnhancementOutput = z.infer<typeof templateEnhancementOutputSchema>;

/**
 * Text enhancement output schema (simple text)
 */
export const textEnhancementOutputSchema = z.object({
  content: z.string().describe('The enhanced text content'),
});

export type TextEnhancementOutput = z.infer<typeof textEnhancementOutputSchema>;

/**
 * Job analysis output schema (for tool use)
 */
export const jobAnalysisOutputSchema = z.object({
  title: z.string().describe('The job title'),
  company: z.string().describe('The company name'),
  requirements: z.object({
    required: z.array(z.string()).describe('Required skills and qualifications'),
    preferred: z.array(z.string()).describe('Preferred/nice-to-have skills'),
    experience: z.string().optional().describe('Required years of experience'),
  }),
  responsibilities: z.array(z.string()).describe('Key job responsibilities'),
  keywords: z.array(z.string()).describe('Important keywords for ATS optimization'),
  culture: z.string().optional().describe('Company culture hints from the posting'),
});

export type JobAnalysisOutput = z.infer<typeof jobAnalysisOutputSchema>;
