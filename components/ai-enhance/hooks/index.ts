/**
 * AI Enhancement Hooks Index
 */

export { useFileAttachments } from './useFileAttachments';
export { useEnhanceHistory } from './useEnhanceHistory';
export { useAITask } from './useAITask';
export { useResumeGeneration } from './useResumeGeneration';
export { useResumeEnhancement } from './useResumeEnhancement';
export { useTextEnhancement } from './useTextEnhancement';
export { useCoverLetterGeneration } from './useCoverLetterGeneration';
export { useTemplateEnhancement, useTemplateGeneration } from './useTemplateEnhancement';

// New conversational AI hooks
export {
  useConversation,
  type ConversationMode,
  type ConversationAttachment,
  type ConversationMessage,
  type ConversationContext,
  type ConversationState,
  type SendMessageOptions,
  type UseConversationOptions,
  type UseConversationReturn,
} from './useConversation';
