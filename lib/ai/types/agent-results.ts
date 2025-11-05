/**
 * Agent Result Types
 * 
 * Type definitions for agent outputs with Zod validation schemas
 */

import { z } from 'zod';

/**
 * Job Analysis Result Types
 */
export const JobAnalysisResultSchema = z.object({
  jobTitle: z.string(),
  companyName: z.string(),
  requirements: z.object({
    required: z.array(z.string()),
    preferred: z.array(z.string())
  }),
  keywords: z.array(z.string()),
  atsKeywords: z.array(z.string()),
  jobSummary: z.string(),
  keyResponsibilities: z.array(z.string())
});

export type JobAnalysisResult = z.infer<typeof JobAnalysisResultSchema>;

/**
 * Raw job analysis response from AI (before transformation)
 */
export const JobAnalysisRawResponseSchema = z.object({
  jobTitle: z.string(),
  companyName: z.string(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  atsKeywords: z.array(z.string()),
  keyResponsibilities: z.array(z.string()),
  summary: z.string()
});

export type JobAnalysisRawResponse = z.infer<typeof JobAnalysisRawResponseSchema>;

/**
 * Profile Matching Result Types
 */
export const ProfileMatchResultSchema = z.object({
  relevanceScore: z.number().min(0).max(100),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  experienceMatch: z.number().min(0).max(10),
  recommendations: z.array(z.string())
});

export type ProfileMatchResult = z.infer<typeof ProfileMatchResultSchema>;

/**
 * Format Validation Result Types
 */
export const FormatValidationIssueSchema = z.object({
  severity: z.enum(['error', 'warning', 'info']),
  message: z.string(),
  location: z.string().optional()
});

export const FormatValidationResultSchema = z.object({
  atsCompliant: z.boolean(),
  issues: z.array(FormatValidationIssueSchema),
  recommendations: z.array(z.string())
});

export type FormatValidationIssue = z.infer<typeof FormatValidationIssueSchema>;
export type FormatValidationResult = z.infer<typeof FormatValidationResultSchema>;

/**
 * Cover Letter Result Types
 */
export const CoverLetterResultSchema = z.object({
  content: z.string(),
  structure: z.object({
    opening: z.string(),
    body: z.array(z.string()),
    closing: z.string()
  }),
  tone: z.string(),
  wordCount: z.number()
});

export type CoverLetterResult = z.infer<typeof CoverLetterResultSchema>;

/**
 * Generic Agent Result Wrapper
 */
export interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  tokensUsed: number;
  duration: number;
}

/**
 * Type guard for successful agent results
 */
export function isSuccessfulResult<T>(
  result: AgentResult<T>
): result is AgentResult<T> & { success: true; data: T } {
  return result.success === true && result.data !== undefined;
}

/**
 * Type guard for failed agent results
 */
export function isFailedResult<T>(
  result: AgentResult<T>
): result is AgentResult<T> & { success: false; error: string } {
  return result.success === false && result.error !== undefined;
}

/**
 * Validation function using Zod schema
 */
export function validateAgentResult<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { valid: true; data: T } | { valid: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { valid: true, data: result.data };
  }
  
  return {
    valid: false,
    errors: result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
  };
}
