/**
 * Cover Letter Generation Agent
 * 
 * Generates personalized cover letters for job applications.
 * The user's profile is the SINGLE SOURCE OF TRUTH - nothing is fabricated.
 */

import { generateText } from 'ai';
import type { Resume } from '@/lib/validations/jsonresume';
import type { AIProvider } from '@/lib/ai/providers';
import { extractJSON } from '../shared/utils';
import { COVER_LETTER_SYSTEM_PROMPT, buildCoverLetterPrompt } from './prompt';

// ============================================================================
// Types
// ============================================================================

export interface GenerateCoverLetterInput {
  provider: AIProvider;
  modelId: string;
  jobDescription: string;
  userResume: Resume;
}

export interface GenerateCoverLetterResult {
  content: string;
  tone: string;
  jobTitle: string;
  companyName: string;
}

// ============================================================================
// Agent
// ============================================================================

/**
 * Generate a cover letter for a specific job
 * 
 * @param input - The generation input
 * @returns The generated cover letter with job metadata
 */
export async function generateCoverLetter(
  input: GenerateCoverLetterInput
): Promise<GenerateCoverLetterResult> {
  const model = input.provider.createLanguageModel(input.modelId);

  const result = await generateText({
    model,
    system: COVER_LETTER_SYSTEM_PROMPT,
    prompt: buildCoverLetterPrompt(input.jobDescription, input.userResume),
  });

  try {
    const jsonStr = extractJSON(result.text);
    const parsed = JSON.parse(jsonStr);
    
    return {
      content: parsed.coverLetter || parsed.content || result.text.trim(),
      tone: 'professional',
      jobTitle: parsed.jobTitle || 'Position',
      companyName: parsed.companyName || 'Company',
    };
  } catch (error) {
    // Fallback: return raw text if JSON parsing fails
    console.error('Failed to parse cover letter response:', error);
    return {
      content: result.text.trim(),
      tone: 'professional',
      jobTitle: 'Position',
      companyName: 'Company',
    };
  }
}
