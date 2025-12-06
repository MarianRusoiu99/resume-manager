/**
 * AI Enhancement Hooks Index
 */

export { useFileAttachments } from './useFileAttachments';
export { useEnhanceHistory } from './useEnhanceHistory';

// Centralized enhancement hooks
export {
  useTextEnhancement,
  useResumeEnhancement,
  useTemplateEnhancement,
  type TextEnhancementOptions,
  type TemplateEnhancementOptions,
  type EnhancementResult,
  type UseAIEnhancementReturn,
} from './useAIEnhancement';
