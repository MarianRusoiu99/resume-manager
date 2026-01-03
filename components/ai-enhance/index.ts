/**
 * AI Enhancement Components
 * 
 * A modular, reusable system for AI-powered content enhancement.
 * 
 * Components are organized into:
 * - Prompt: ChatGPT-style input with file attachments
 * - Preview: Comparison views for original vs enhanced content
 * - Modals: Ready-to-use modal dialogs
 * - Hooks: State management for enhancements
 * 
 * Architecture:
 * - Centralized hooks (useResumeEnhancement, useTemplateEnhancement) handle AI logic
 * - Reusable preview components (SideBySideComparison, PreviewIframe) for layouts
 * - Modal components compose these primitives for specific use cases
 */

// Main components
export { AIEnhanceButton } from './AIEnhanceButton';
export { AIEnhanceTextarea } from './AIEnhanceTextarea';

// Modal components
export {
  AIEnhanceTextModal,
  AIEnhanceBaseModal,
  AIEnhanceResumeModal,
  AIEnhanceTemplateModal,
} from './modals';

// Prompt components
export { PromptInput, PromptPresets, FileAttachment, FileAttachmentList } from './prompt';

// Preview components
export { ContentPreview, ComparisonTabs, ResumePreviewComparison, ResumePreviewSideBySide } from './preview';
export {
  SideBySideComparison,
  EmptyPanelContent,
  PreviewIframe,
  ResumeVisualComparison,
  ResumeTextComparison,
  resumeToText,
  TemplateVisualComparison,
  TemplateCodeComparison,
} from './preview';

// Hooks
export { useFileAttachments, useEnhanceHistory } from './hooks';
export {
  useTextEnhancement,
  useResumeEnhancement,
  useTemplateEnhancement,
} from './hooks';

// Types
export type {
  FileAttachment as FileAttachmentType,
  EnhancementHistoryEntry,
  InstructionPreset,
  PreviewMode,
  AIEnhanceBaseModalProps,
  AIEnhanceTextModalProps,
  EnhancementState,
  EnhancementResult,
} from './types';

export { TEXT_PRESETS, RESUME_PRESETS } from './types';
