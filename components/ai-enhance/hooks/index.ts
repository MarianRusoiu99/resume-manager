/**
 * AI Enhancement Hooks Index
 */

export { useFileAttachments } from './useFileAttachments';
export { useEnhanceHistory } from './useEnhanceHistory';
export { useAITask } from './useAITask';

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
