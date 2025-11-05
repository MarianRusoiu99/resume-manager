/**
 * Content Optimization User Prompt Template
 */

export const CONTENT_OPTIMIZATION_USER_TEMPLATE = `Optimize this resume for the target job while maintaining authenticity and ATS compliance.

JOB INFORMATION:
Key Responsibilities:
{keyResponsibilities}

REQUIRED SKILLS:
{requiredSkills}

PREFERRED SKILLS:
{preferredSkills}

ATS KEYWORDS TO INCORPORATE:
{atsKeywords}

CANDIDATE'S PROFILE:
Matched Skills: {matchedSkills}
Missing Skills: {missingSkills}
Relevance Score: {relevanceScore}/100
Experience Match: {experienceMatch}/10

RECOMMENDATIONS FOR OPTIMIZATION:
{recommendations}

CURRENT RESUME:
{currentResume}

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

export interface ContentOptimizationPromptInput {
  jobTitle: string;
  companyName: string;
  keyResponsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  atsKeywords: string[];
  matchedSkills: string[];
  missingSkills: string[];
  relevanceScore: number;
  experienceMatch: number;
  recommendations: string[];
  currentResume: string; // JSON string
}

export function formatContentOptimizationPrompt(input: ContentOptimizationPromptInput): string {
  return CONTENT_OPTIMIZATION_USER_TEMPLATE
    .replace('{keyResponsibilities}', input.keyResponsibilities.map(r => `- ${r}`).join('\n'))
    .replace('{requiredSkills}', input.requiredSkills.join(', '))
    .replace('{preferredSkills}', input.preferredSkills.join(', '))
    .replace('{atsKeywords}', input.atsKeywords.join(', '))
    .replace('{matchedSkills}', input.matchedSkills.join(', '))
    .replace('{missingSkills}', input.missingSkills.join(', '))
    .replace('{relevanceScore}', input.relevanceScore.toString())
    .replace('{experienceMatch}', input.experienceMatch.toString())
    .replace('{recommendations}', input.recommendations.map(r => `- ${r}`).join('\n'))
    .replace('{currentResume}', input.currentResume);
}
