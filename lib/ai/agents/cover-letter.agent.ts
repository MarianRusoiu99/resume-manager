import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { retryWithBackoff, AI_RETRY_CONFIG } from '@/lib/utils/retry';
import type { Resume } from '@/lib/validations/jsonresume';
import { 
  COVER_LETTER_SYSTEM_PROMPT as SYSTEM_PROMPT,
  COVER_LETTER_USER_TEMPLATE 
} from '@/lib/ai/prompts';

/**
 * Cover Letter Agent
 * Generates personalized cover letters based on job description and user profile (JSON Resume)
 */

interface CoverLetterInput {
  jobDescription: string;
  jobTitle: string; // Now required - extracted from job analysis
  companyName: string; // Now required - extracted from job analysis
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

export async function coverLetterAgent(
  input: CoverLetterInput,
  model: ChatOpenAI
): Promise<CoverLetterOutput> {
  try {
    // Prepare template variables
    const jobTitle = input.jobTitle;
    const companyName = input.companyName;
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
      ? `\n\nPERSONAL INSTRUCTIONS FROM USER:
${input.personalInstructions}

Please incorporate these instructions while maintaining professional quality and authenticity.`
      : '';
    
    
    // Use LangChain's PromptTemplate for variable substitution
    const promptTemplate = PromptTemplate.fromTemplate(COVER_LETTER_USER_TEMPLATE);
    const prompt = await promptTemplate.format({
      jobTitle,
      companyName,
      jobSummary,
      keyRequirements,
      tone,
      candidateName,
      currentRole,
      topSkills: technicalSkills,
      relevantExperience,
      accomplishments,
      fitScore: fitScore.toString(),
      matchingSkills,
      topExperiences,
      personalInstructionsSection,
    });
    
    console.log(prompt)
    // Call LLM
    const messages = [
      new SystemMessage(SYSTEM_PROMPT),
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
    console.log(parsed)
    return parsed;
  } catch (error) {
    console.error('Error in cover letter agent:', error);
    throw new Error(`Cover letter generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
