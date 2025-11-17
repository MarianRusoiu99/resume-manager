/**
 * Content Optimization User Prompt Template
 */

export const CONTENT_OPTIMIZATION_USER_TEMPLATE = `Optimize this resume for the target job while maintaining ABSOLUTE AUTHENTICITY and focusing on transferable skills.

JOB INFORMATION:
Title: {jobTitle}
Company: {companyName}
Key Responsibilities:
{keyResponsibilities}

REQUIRED SKILLS:
{requiredSkills}

PREFERRED SKILLS:
{preferredSkills}

ATS KEYWORDS TO INCORPORATE (only if genuinely applicable):
{atsKeywords}

CANDIDATE'S PROFILE:
Matched Skills: {matchedSkills}
Missing Skills: {missingSkills}
Relevance Score: {relevanceScore}/100
Experience Match: {experienceMatch}/10

RECOMMENDATIONS FOR OPTIMIZATION:
{recommendations}

CURRENT RESUME (CANDIDATE'S ACTUAL EXPERIENCE):
{currentResume}

⚠️ CRITICAL AUTHENTICITY REQUIREMENTS:
- DO NOT fabricate, exaggerate, or invent ANY skills, experience, or achievements
- DO NOT add missing skills to the resume - they are missing for a reason
- DO NOT create fictional experience with required technologies
- FOCUS on transferable skills from existing experience

✅ OPTIMIZATION INSTRUCTIONS:

1. **Professional Summary**: 
   - Rewrite using ONLY real background
   - Emphasize transferable skills that connect to job requirements
   - If lacking direct experience, highlight related skills from other domains

2. **Work Experience**: 
   - Reorder to show most relevant experience first
   - Reframe existing accomplishments to show relevance to target role
   - Identify transferable skills: leadership, communication, problem-solving, etc.
   - Use ATS keywords ONLY where they genuinely apply to actual experience
   - Connect past achievements to future job needs

3. **Skills Section**: 
   - ONLY list skills from matched skills (candidate actually has)
   - DO NOT add missing skills
   - Prioritize matched skills that align with job requirements
   - Group related skills to show breadth

4. **Transferable Skills to Emphasize**:
   - Project management experience → Leadership roles
   - Customer service → Client relations, communication
   - Teaching/Training → Mentoring, presentation skills
   - Data work → Analysis, attention to detail
   - Any coordination → Organizational skills
   - Problem-solving in any domain → Critical thinking

5. **Education & Certifications**: 
   - Highlight relevant qualifications
   - ONLY include actual credentials

6. **Projects**: 
   - Emphasize projects demonstrating transferable problem-solving
   - Highlight methodologies that apply to target role

Return the optimized resume in JSON Resume format (same structure as input).
Remember: Truthful reframing is powerful. Fabrication is forbidden. Work with what the candidate actually has.`;

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
    .replace('{jobTitle}', input.jobTitle)
    .replace('{companyName}', input.companyName)
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
