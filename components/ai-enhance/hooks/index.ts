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
