/**
 * Resume Optimization User Prompt Template
 * 
 * Template for complete resume optimization requests
 */

import type { Resume } from '@/lib/validations/jsonresume';

export interface ResumeOptimizationInput {
  jobTitle: string;
  companyName: string;
  keyResponsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  atsKeywords: string[];
  currentResume: Resume;
  personalInstructions?: string;
}

/**
 * Format resume optimization prompt with job analysis and user resume
 */
export function formatResumeOptimizationPrompt(input: ResumeOptimizationInput): string {
  return `Optimize this resume for the target job while maintaining authenticity and ATS compliance.

JOB INFORMATION:
- Job Title: ${input.jobTitle}
- Company: ${input.companyName}
- Key Responsibilities: ${input.keyResponsibilities.join('; ')}

REQUIRED SKILLS:
${input.requiredSkills.join(', ')}

PREFERRED SKILLS:
${input.preferredSkills.join(', ')}

ATS KEYWORDS TO INCORPORATE:
${input.atsKeywords.join(', ')}

CURRENT RESUME:
${JSON.stringify(input.currentResume, null, 2)}

${input.personalInstructions ? `SPECIAL INSTRUCTIONS:\n${input.personalInstructions}\n` : ''}

OPTIMIZATION INSTRUCTIONS:
1. **Professional Summary**: Rewrite to emphasize alignment with job requirements
2. **Work Experience**: 
   - Reorder and emphasize experiences relevant to this role
   - Incorporate ATS keywords naturally in descriptions
   - Add quantifiable achievements where possible
   - Use action verbs that match job description language
3. **Skills Section**: Prioritize skills that match job requirements
4. **Education & Certifications**: Highlight relevant qualifications
5. **Projects** (if applicable): Emphasize projects using required technologies

Return the optimized resume in JSON Resume format (same structure as input).
Maintain all authentic information - do not fabricate experience or skills.`;
}
