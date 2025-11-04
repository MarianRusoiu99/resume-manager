/**
 * Profile Matching User Prompt Template
 * 
 * Template for the user message with job and candidate data
 */

export const PROFILE_MATCHING_USER_TEMPLATE = `Job Requirements:
- Required Skills: {requiredSkills}
- Preferred Skills: {preferredSkills}
- Key Responsibilities: {keyResponsibilities}
- Job Summary: {jobSummary}

Candidate Profile:
- Name: {candidateName}
- Summary: {candidateSummary}
- Experience: {experience}
- Education: {education}
- Skills: {skills}

Provide your analysis in the following JSON format:
\`\`\`json
{{
  "overallMatchScore": 0-100,
  "skillMatchScore": 0-100,
  "experienceRelevanceScore": 0-10,
  "educationMatchScore": 0-10,
  "matchedSkills": ["skill1", "skill2", ...],
  "missingRequiredSkills": ["skill1", "skill2", ...],
  "missingPreferredSkills": ["skill1", "skill2", ...],
  "relevantExperience": [
    {{
      "company": "Company Name",
      "title": "Job Title",
      "relevanceScore": 0-10,
      "reasoning": "Why this experience is relevant"
    }}
  ],
  "strengths": ["strength1", "strength2", ...],
  "gaps": ["gap1", "gap2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...]
}}
\`\`\``;
