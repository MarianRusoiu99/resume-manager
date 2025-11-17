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
  return `Write a compelling, AUTHENTIC cover letter for this job application.

APPLICANT: ${input.applicantName}

JOB DETAILS:
- Job Title: ${input.jobTitle}
- Company: ${input.companyName}
- Summary: ${input.jobSummary}
- Key Responsibilities: ${input.keyResponsibilities.join('; ')}

APPLICANT'S ACTUAL BACKGROUND (use ONLY this information):
${JSON.stringify(input.optimizedResume, null, 2)}

⚠️ CRITICAL AUTHENTICITY REQUIREMENTS:
- Use ONLY experience, skills, and achievements from the resume above
- DO NOT fabricate experience, skills, or qualifications
- DO NOT claim expertise in technologies not listed in the resume
- DO NOT invent projects, roles, or accomplishments
- If the applicant lacks direct experience, emphasize transferable skills

✅ INSTRUCTIONS:

1. **Write a professional, engaging cover letter in markdown format** (3-4 paragraphs, 250-400 words)

2. **Opening Paragraph**:
   - Express genuine enthusiasm for the specific role and company
   - Briefly state relevant background using ACTUAL experience

3. **Body (1-2 paragraphs)**:
   - Connect applicant's ACTUAL experience to job requirements
   - Use specific examples from their real work history
   - Emphasize transferable skills:
     * If they have leadership experience, highlight management capabilities
     * If they have customer service, emphasize communication skills
     * If they have analytical work, showcase problem-solving
     * If they coordinated projects, stress organizational abilities
   - Show how past achievements predict future success in this role
   - ONLY reference skills and technologies they actually know

4. **Closing Paragraph**:
   - Reiterate interest and fit based on real capabilities
   - Call to action with confidence grounded in actual experience
   - Express eagerness to discuss how their background applies

5. **Tone**: Professional but warm, confident but honest, enthusiastic but genuine

6. **What to do if lacking direct experience**:
   - Focus on transferable skills and learning ability
   - Emphasize relevant projects or experiences that demonstrate related capabilities
   - Show genuine interest and willingness to grow
   - Connect related experience to the new role's requirements

Generate the cover letter content in markdown format. Remember: Authenticity builds trust. Fabrication destroys credibility.`;
}
