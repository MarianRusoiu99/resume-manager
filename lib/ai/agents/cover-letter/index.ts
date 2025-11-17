/**
 * Cover Letter Prompts - Main Export
 * 
 * Professional cover letter generation for job applications
 */

export {
  COVER_LETTER_SYSTEM_PROMPT,
  COVER_LETTER_GUIDELINES
} from './system-prompt';

export {
  formatCoverLetterPrompt,
  type CoverLetterInput
} from './user-template';

// Agent execution
export {
  generateCoverLetter,
  coverLetterSchema,
  type CoverLetterResult,
  type GenerateCoverLetterInput
} from './agent';
