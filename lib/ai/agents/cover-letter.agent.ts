import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { retryWithBackoff, AI_RETRY_CONFIG } from '@/lib/utils/retry';
import type { Resume } from '@/lib/validations/jsonresume';

/**
 * Cover Letter Agent
 * Generates personalized cover letters based on job description and user profile (JSON Resume)
 */

interface CoverLetterInput {
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  jobAnalysis: {
    summary: string;
    requiredSkills: string[];
    preferredSkills: string[];
    keyResponsibilities: string[];
    companyInfo?: string;
    tone?: string;
  };
  userResume: Resume; // Use JSON Resume format
  matchingResults: {
    overallScore: number;
    matchingSkills: string[];
    missingSkills: string[];
    topExperiences: string[];
  };
  personalInstructions?: string; // Optional custom instructions from user
}

interface CoverLetterOutput {
  coverLetter: string;
  structure: {
    opening: string;
    body: string[];
    closing: string;
  };
  tone: string;
  wordCount: number;
}

const COVER_LETTER_SYSTEM_PROMPT = `You are an expert cover letter writer with years of experience helping job seekers craft compelling, personalized cover letters. Your cover letters:

1. Are authentic and genuine - avoid generic phrases and clichés
2. Tell a compelling story that connects the candidate's experience to the job
3. Demonstrate specific knowledge about the company and role
4. Highlight relevant accomplishments with concrete examples
5. Match the tone and culture suggested by the job description
6. Are concise yet impactful (250-400 words)
7. Follow professional business letter format

CRITICAL RULES:
- Never use phrases like "I am writing to express my interest" - start with impact
- Never repeat information from the resume verbatim - add context and story
- Always include specific examples and metrics when possible
- Adapt tone based on company culture (formal for corporate, casual for startups)
- Make every sentence earn its place - no filler content
- Focus on what you can do for the company, not what the company can do for you`;

const COVER_LETTER_PROMPT_TEMPLATE = `Generate a personalized, compelling cover letter for this job application.

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
{
  "coverLetter": "Full cover letter text with proper spacing and formatting",
  "structure": {
    "opening": "First paragraph text",
    "body": ["Array of body paragraph texts"],
    "closing": "Closing paragraph text"
  },
  "tone": "professional|enthusiastic|technical|creative",
  "wordCount": <number>
}`;

export async function coverLetterAgent(
  input: CoverLetterInput,
  model: ChatOpenAI
): Promise<CoverLetterOutput> {
  try {
    // Prepare template variables
    const jobTitle = input.jobTitle || 'the position';
    const companyName = input.companyName || 'your company';
    const jobSummary = input.jobAnalysis.summary;
    const keyRequirements = input.jobAnalysis.requiredSkills.slice(0, 5).join(', ');
    const tone = input.jobAnalysis.tone || 'professional';
    
    // Extract data from JSON Resume v1.0.0 format - ensure proper field access
    const basics = input.userResume.basics || {};
    const candidateName = basics.name || 'Candidate';
    const currentRole = input.userResume.work?.[0]?.position || basics.label || 'Professional';
    
    // Get technical skills from JSON Resume format - access keywords array properly
    const technicalSkills = (input.userResume.skills || [])
      .filter(skill => skill.keywords && Array.isArray(skill.keywords) && skill.keywords.length > 0)
      .flatMap(skill => skill.keywords || [])
      .filter(Boolean) // Remove any null/undefined values
      .slice(0, 5)
      .join(', ') || 'relevant skills';
    
    // Get relevant experience snippets from JSON Resume format - ensure fields exist
    const relevantExperience = (input.userResume.work || [])
      .slice(0, 2)
      .map(w => {
        const position = w.position || 'Position';
        const company = w.name || 'Company';
        return `${position} at ${company}`;
      })
      .join('; ') || 'relevant experience';
    
    // Get accomplishments from highlights in JSON Resume format - safely access nested arrays
    const accomplishments = (input.userResume.work || [])
      .slice(0, 2)
      .flatMap(w => (w.highlights || []).slice(0, 2))
      .filter(Boolean) // Remove empty strings
      .join('; ') || 'key achievements';
    
    const fitScore = Math.round(input.matchingResults.overallScore);
    const matchingSkills = input.matchingResults.matchingSkills.slice(0, 5).join(', ');
    const topExperiences = input.matchingResults.topExperiences.slice(0, 3).join('; ');
    
    // Handle personal instructions if provided
    const personalInstructionsSection = input.personalInstructions
      ? `PERSONAL INSTRUCTIONS FROM CANDIDATE:
${input.personalInstructions}

Please incorporate these instructions while maintaining professional quality and authenticity.`
      : '';
    
    // Determine tone guidance
    let toneGuidance = '';
    if (tone.toLowerCase().includes('startup') || tone.toLowerCase().includes('casual')) {
      toneGuidance = 'Use a warm, enthusiastic, and slightly casual tone. Show personality while maintaining professionalism.';
    } else if (tone.toLowerCase().includes('technical') || tone.toLowerCase().includes('engineering')) {
      toneGuidance = 'Use a clear, direct, technically-focused tone. Emphasize technical skills and problem-solving.';
    } else if (tone.toLowerCase().includes('creative')) {
      toneGuidance = 'Use a creative, engaging tone that shows your unique perspective and passion.';
    } else {
      toneGuidance = 'Use a professional, confident, business-formal tone.';
    }
    
    // Fill template
    const prompt = COVER_LETTER_PROMPT_TEMPLATE
      .replace('{jobTitle}', jobTitle)
      .replace('{companyName}', companyName)
      .replace('{jobSummary}', jobSummary)
      .replace('{keyRequirements}', keyRequirements)
      .replace('{tone}', tone)
      .replace('{candidateName}', candidateName)
      .replace('{currentRole}', currentRole)
      .replace('{topSkills}', technicalSkills)
      .replace('{relevantExperience}', relevantExperience)
      .replace('{accomplishments}', accomplishments)
      .replace('{fitScore}', fitScore.toString())
      .replace('{matchingSkills}', matchingSkills)
      .replace('{topExperiences}', topExperiences)
      .replace('{personalInstructionsSection}', personalInstructionsSection)
      .replace('{toneGuidance}', toneGuidance);
    
    // Call LLM
    const messages = [
      new SystemMessage(COVER_LETTER_SYSTEM_PROMPT),
      new HumanMessage(prompt)
    ];
    
    const response = await retryWithBackoff(
      () => model.invoke(messages),
      {
        ...AI_RETRY_CONFIG,
        onRetry: (error, attempt, delay) => {
          console.warn(`[coverLetterAgent] Retry attempt ${attempt} after ${delay}ms due to: ${error.message}`);
        },
      }
    );
    const content = response.content as string;
    
    // Parse JSON response
    let parsed: CoverLetterOutput;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsed = JSON.parse(jsonStr);
    } catch {
      // Fallback: treat entire content as cover letter text
      console.warn('Failed to parse structured cover letter, using raw content');
      const wordCount = content.split(/\s+/).length;
      parsed = {
        coverLetter: content.trim(),
        structure: {
          opening: content.split('\n\n')[0] || '',
          body: content.split('\n\n').slice(1, -1) || [],
          closing: content.split('\n\n').slice(-1)[0] || ''
        },
        tone: tone,
        wordCount
      };
    }
    
    return parsed;
  } catch (error) {
    console.error('Error in cover letter agent:', error);
    throw new Error(`Cover letter generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
