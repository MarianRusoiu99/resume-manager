/**
 * Job Analysis User Prompt Template
 * 
 * Template for the actual analysis request sent to the AI
 * Compatible with LangChain's PromptTemplate
 */

export const JOB_ANALYSIS_USER_TEMPLATE = `Analyze the following job posting and extract:

1. **Job Title**: The position title (extract from the description if not explicitly stated at the top)
2. **Company Name**: The company/organization name (extract from the description)
3. **Required Skills**: Must-have technical and soft skills explicitly stated
4. **Preferred Skills**: Nice-to-have skills or "bonus" qualifications
5. **ATS Keywords**: Important terms that ATS systems look for (technologies, methodologies, certifications)
6. **Key Responsibilities**: Main duties and expectations (max 5)
7. **Job Summary**: A 2-3 sentence overview of the role

Job Description:
{jobDescription}

Provide your analysis in the following JSON format:
\`\`\`json
{{
  "jobTitle": "Extracted job title",
  "companyName": "Extracted company name",
  "requiredSkills": ["skill1", "skill2", ...],
  "preferredSkills": ["skill1", "skill2", ...],
  "atsKeywords": ["keyword1", "keyword2", ...],
  "keyResponsibilities": ["responsibility1", "responsibility2", ...],
  "summary": "Brief summary of the role..."
}}
\`\`\`

IMPORTANT: 
- If job title is not clear, infer it from responsibilities and requirements
- If company name is not mentioned, use "Company" as a placeholder
- Extract jobTitle and companyName from the beginning of the description or any header/title section

Return ONLY the JSON object, nothing else.`;

/**
 * Input interface for job analysis prompt
 * Used with LangChain's PromptTemplate.format()
 */
export interface JobAnalysisPromptInput {
  jobDescription: string;
}
