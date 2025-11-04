/**
 * Job Analysis User Prompt Template
 * 
 * Template for the actual analysis request sent to the AI
 * Compatible with LangChain's PromptTemplate
 */

export const JOB_ANALYSIS_USER_TEMPLATE = `Analyze the following job posting and extract:

1. **Required Skills**: Must-have technical and soft skills explicitly stated
2. **Preferred Skills**: Nice-to-have skills or "bonus" qualifications
3. **ATS Keywords**: Important terms that ATS systems look for (technologies, methodologies, certifications)
4. **Key Responsibilities**: Main duties and expectations (max 5)
5. **Job Summary**: A 2-3 sentence overview of the role

Job Title: {jobTitle}
Company: {companyName}

Job Description:
{jobDescription}

Provide your analysis in the following JSON format:
\`\`\`json
{{
  "requiredSkills": ["skill1", "skill2", ...],
  "preferredSkills": ["skill1", "skill2", ...],
  "atsKeywords": ["keyword1", "keyword2", ...],
  "keyResponsibilities": ["responsibility1", "responsibility2", ...],
  "summary": "Brief summary of the role..."
}}
\`\`\`

Return ONLY the JSON object, nothing else.`;

/**
 * Input interface for job analysis prompt
 * Used with LangChain's PromptTemplate.format()
 */
export interface JobAnalysisPromptInput {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
}
