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
export { AIEnhanceTextModal } from '../modals/AIEnhanceTextModal';
export { AIEnhanceBaseModal } from '../modals/AIEnhanceBaseModal';
export { AIEnhanceResumeModal } from '../modals/AIEnhanceResumeModal';
export { AIEnhanceTemplateModal } from '../modals/AIEnhanceTemplateModal';

// Prompt components
export { PromptInput } from '../prompt/PromptInput';
export { PromptPresets } from '../prompt/PromptPresets';
export { FileAttachment } from '../prompt/FileAttachment';
export { FileAttachmentList } from '../prompt/FileAttachment';

// Preview components
export { ContentPreview } from '../preview/ContentPreview';
export { ComparisonTabs } from '../preview/ComparisonTabs';
export { ResumePreviewComparison, ResumePreviewSideBySide } from '../preview/ResumePreviewComparison';
export { SideBySideComparison, EmptyPanelContent, PreviewIframe } from '../preview/SideBySideComparison';
export { ResumeVisualComparison } from '../preview/ResumeVisualComparison';
export { ResumeTextComparison, resumeToText } from '../preview/ResumeTextComparison';
export { TemplateVisualComparison } from '../preview/TemplateVisualComparison';
export { TemplateCodeComparison } from '../preview/TemplateCodeComparison';

// Hooks
export { useFileAttachments } from '../hooks/useFileAttachments';
export { useEnhanceHistory } from '../hooks/useEnhanceHistory';
export { useTextEnhancement } from '../hooks/useTextEnhancement';
export { useResumeEnhancement } from '../hooks/useResumeEnhancement';
export { useTemplateEnhancement } from '../hooks/useTemplateEnhancement';

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
