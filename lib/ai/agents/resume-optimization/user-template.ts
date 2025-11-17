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
  return `Optimize this resume for the target job while maintaining ABSOLUTE AUTHENTICITY and focusing on transferable skills.

JOB INFORMATION:
- Job Title: ${input.jobTitle}
- Company: ${input.companyName}
- Key Responsibilities: ${input.keyResponsibilities.join('; ')}

REQUIRED SKILLS:
${input.requiredSkills.join(', ')}

PREFERRED SKILLS:
${input.preferredSkills.join(', ')}

ATS KEYWORDS TO INCORPORATE (only if genuinely applicable):
${input.atsKeywords.join(', ')}

CURRENT RESUME (CANDIDATE'S ACTUAL EXPERIENCE):
${JSON.stringify(input.currentResume, null, 2)}

${input.personalInstructions ? `SPECIAL INSTRUCTIONS:\n${input.personalInstructions}\n` : ''}

CRITICAL OPTIMIZATION INSTRUCTIONS:

⚠️ AUTHENTICITY REQUIREMENTS - READ CAREFULLY:
- DO NOT fabricate, exaggerate, or invent ANY skills, experience, tools, or achievements
- DO NOT add technologies, frameworks, or tools the candidate hasn't actually used
- DO NOT create fictional projects, roles, or accomplishments
- DO NOT claim skills the candidate doesn't possess
- If the candidate lacks a required skill, DO NOT add it - instead highlight related transferable skills

✅ WHAT YOU SHOULD DO:

1. **Professional Summary**: 
   - Rewrite using ONLY the candidate's real background
   - Emphasize transferable skills that connect to the job requirements
   - Example: If they managed projects in retail, highlight "project management and team leadership"

2. **Work Experience**: 
   - Reorder to show most relevant experience first
   - Reframe existing accomplishments to show their relevance to target role
   - Identify transferable skills (leadership, communication, problem-solving, analysis, etc.)
   - Connect past achievements to future job needs
   - Use ATS keywords ONLY where they genuinely apply to existing experience
   - Example: "Coordinated cross-functional teams" shows collaboration applicable to many roles

3. **Skills Section**: 
   - ONLY list skills from the original resume
   - Prioritize skills that match job requirements
   - Group related skills to demonstrate breadth

4. **Transferable Skills Examples**:
   - Customer service → Client relations, communication, conflict resolution
   - Teaching → Presentation, mentoring, explaining complex concepts
   - Retail management → Inventory systems, team leadership, performance metrics
   - Data entry → Attention to detail, data accuracy, system proficiency
   - Any leadership → Project management, delegation, decision-making
   - Any analysis → Critical thinking, problem-solving, pattern recognition

5. **Education & Certifications**: 
   - Feature relevant qualifications prominently
   - ONLY include actual degrees and certifications

6. **Projects**: 
   - Emphasize projects using technologies/approaches relevant to target role
   - Highlight problem-solving methods that transfer

Return the optimized resume in JSON Resume format (same structure as input).
Remember: Truthful reframing of existing experience is powerful. Fabrication is forbidden.`;
}
