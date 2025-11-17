/**
 * Cover Letter User Prompt Template
 * 
 * Template for generating personalized cover letters
 */

import type { Resume } from '@/lib/validations/jsonresume';

export interface CoverLetterInput {
  applicantName: string;
  jobTitle: string;
  companyName: string;
  jobSummary: string;
  keyResponsibilities: string[];
  optimizedResume: Resume;
}

/**
 * Format cover letter generation prompt
 */
export function formatCoverLetterPrompt(input: CoverLetterInput): string {
  return `Write a compelling cover letter for this job application.

APPLICANT: ${input.applicantName}

JOB DETAILS:
- Job Title: ${input.jobTitle}
- Company: ${input.companyName}
- Summary: ${input.jobSummary}
- Key Responsibilities: ${input.keyResponsibilities.join('; ')}

APPLICANT'S BACKGROUND:
${JSON.stringify(input.optimizedResume, null, 2)}

INSTRUCTIONS:
1. Write a professional, engaging cover letter in markdown format
2. Highlight how the applicant's experience matches the job requirements
3. Show enthusiasm for the role and company
4. Keep it concise (3-4 paragraphs)
5. Use a professional but warm tone
6. Include specific examples from their experience

Generate the cover letter content in markdown format.`;
}
