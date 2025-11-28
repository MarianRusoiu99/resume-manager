/**
 * Job Analysis User Prompt Template - Simplified
 * 
 * Template for analyzing job descriptions
 */

export interface SimpleJobAnalysisInput {
  jobDescription: string;
}

/**
 * Simple format for job analysis prompt - just needs the job description
 */
export function formatSimpleJobAnalysisPrompt(jobDescription: string): string {
  return `Analyze this job description and extract structured information:

${jobDescription}

Extract the job title, company name, required skills, preferred skills, ATS keywords, key responsibilities, and a brief summary.`;
}
