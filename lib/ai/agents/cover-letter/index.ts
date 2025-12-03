/**
 * Cover Letter Agent - Main Export
 */

// Prompt (for customization)
export {
  COVER_LETTER_SYSTEM_PROMPT,
  COVER_LETTER_USER_PROMPT,
  buildCoverLetterPrompt,
} from './prompt';

// Agent
export {
  generateCoverLetter,
  type GenerateCoverLetterInput,
  type GenerateCoverLetterResult,
} from './agent';
