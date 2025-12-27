/**
 * AI Modes Index
 *
 * Registers all AI conversation modes
 */

import { registerMode } from '../chat/orchestrator';
import { resumeGenerationMode } from './resume-generation.mode';
import { resumeEnhancementMode } from './resume-enhancement.mode';
import { coverLetterMode } from './cover-letter.mode';
import { templateGenerationMode } from './template-generation.mode';
import { templateEnhancementMode } from './template-enhancement.mode';
import { textEnhancementMode } from './text-enhancement.mode';

// Export all modes
export { resumeGenerationMode } from './resume-generation.mode';
export { resumeEnhancementMode } from './resume-enhancement.mode';
export { coverLetterMode } from './cover-letter.mode';
export { templateGenerationMode } from './template-generation.mode';
export { templateEnhancementMode } from './template-enhancement.mode';
export { textEnhancementMode } from './text-enhancement.mode';

// Export types
export * from './types';

/**
 * All available modes
 */
export const allModes = [
  resumeGenerationMode,
  resumeEnhancementMode,
  coverLetterMode,
  templateGenerationMode,
  templateEnhancementMode,
  textEnhancementMode,
] as const;

/**
 * Register all modes with the orchestrator
 * Call this at app startup
 */
export function registerAllModes(): void {
  for (const mode of allModes) {
    registerMode(mode);
  }
}

/**
 * Auto-register modes on import
 * This ensures modes are available when the module is imported
 */
let modesRegistered = false;

export function ensureModesRegistered(): void {
  if (!modesRegistered) {
    registerAllModes();
    modesRegistered = true;
  }
}

// Mode ID constants for type-safe references
export const MODE_IDS = {
  RESUME_GENERATION: 'resume-generation',
  RESUME_ENHANCEMENT: 'resume-enhancement',
  COVER_LETTER: 'cover-letter-generation',
  TEMPLATE_GENERATION: 'template-generation',
  TEMPLATE_ENHANCEMENT: 'template-enhancement',
  TEXT_ENHANCEMENT: 'text-enhancement',
} as const;
