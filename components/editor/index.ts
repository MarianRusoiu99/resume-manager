/**
 * Editor Module Exports
 * 
 * Centralized exports for the unified editor system.
 */

// Context
export { EditorProvider, useEditor, type EditorContextType } from '@/lib/contexts/EditorContext';

// UI Component
export { EditorUI, type EditorUIProps } from './EditorUI';

// Format Converters
export {
  skillsToOldFormat,
  skillsFromOldFormat,
  certificatesToOldFormat,
  certificatesFromOldFormat,
  languagesToOldFormat,
  languagesFromOldFormat,
  calculateCompletionPercentage,
  type OldSkillsFormat,
  type OldCertification,
  type OldLanguage,
} from '@/lib/utils/format-converters';
