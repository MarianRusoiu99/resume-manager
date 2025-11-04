/**
 * Cover Letter User Prompt Template
 * 
 * Template for generating personalized cover letters
 */

export const COVER_LETTER_USER_TEMPLATE = `Generate a personalized, compelling cover letter for this job application.

JOB INFORMATION:
- Job Title: {jobTitle}
- Company: {companyName}
- Job Description Summary: {jobSummary}
- Key Requirements: {keyRequirements}
- Company Culture/Tone: {tone}

CANDIDATE PROFILE:
- Name: {candidateName}
- Current/Most Recent Role: {currentRole}
- Top Skills: {topSkills}
- Relevant Experience: {relevantExperience}
- Key Accomplishments: {accomplishments}

MATCHING ANALYSIS:
- Overall Fit Score: {fitScore}%
- Strongest Matches: {matchingSkills}
- Relevant Experiences: {topExperiences}

{personalInstructionsSection}

INSTRUCTIONS:
1. Opening: Start with a strong, specific hook that shows you understand the company/role. Reference something specific about the company or position that resonates with you.

2. Body (2-3 paragraphs):
   - Paragraph 1: Highlight your most relevant experience with specific examples and results
   - Paragraph 2: Demonstrate how your skills match their needs with concrete accomplishments
   - Paragraph 3 (optional): Show cultural fit or passion for their mission/product

3. Closing: End with confidence and a clear call to action

TONE: {toneGuidance}

OUTPUT FORMAT:
Return a JSON object with:
{{
  "coverLetter": "Full cover letter text with proper spacing and formatting",
  "structure": {{
    "opening": "First paragraph text",
    "body": ["Array of body paragraph texts"],
    "closing": "Closing paragraph text"
  }},
  "tone": "professional|enthusiastic|technical|creative",
  "wordCount": <number>
}}`;
