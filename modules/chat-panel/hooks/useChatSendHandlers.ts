'use client';

import { useCallback } from 'react';
import type { ConversationAttachment, ConversationContext } from '@/modules/ai-enhance/hooks/useConversation';
import type { GenerationType, ModelByType } from './useSessionManager';

interface UseChatSendHandlersOptions {
  sendMessage: (options: {
    message: string;
    attachments?: ConversationAttachment[];
    modelId?: string;
    contextOverride?: Partial<ConversationContext>;
    stream?: boolean;
  }) => Promise<unknown>;
  artifactContextOverride: Partial<ConversationContext> | undefined;
  selectedArtifactRefs: string[];
  modelByType: ModelByType;
  generationType: GenerationType;
  pendingRefsRef: React.MutableRefObject<string[]>;
}

interface HandleSendInput {
  message: string;
  attachments?: ConversationAttachment[];
  modelId?: string;
}

interface UseChatSendHandlersReturn {
  handleSend: (input: HandleSendInput) => Promise<void>;
  handleQuickAction: (prompt: string) => Promise<void>;
}

export function useChatSendHandlers({
  sendMessage,
  artifactContextOverride,
  selectedArtifactRefs,
  modelByType,
  generationType,
  pendingRefsRef,
}: UseChatSendHandlersOptions): UseChatSendHandlersReturn {
  const handleSend = useCallback(async ({
    message,
    attachments,
    modelId: messageModelId,
  }: HandleSendInput) => {
    const trimmed = message.trim();
    if (!trimmed && (!attachments || attachments.length === 0)) return;
    pendingRefsRef.current = [...selectedArtifactRefs];
    const resolvedModelId = messageModelId ?? modelByType[generationType] ?? undefined;
    await sendMessage({
      message: trimmed,
      attachments,
      modelId: resolvedModelId,
      contextOverride: artifactContextOverride,
      stream: true,
    });
  }, [sendMessage, artifactContextOverride, modelByType, generationType, selectedArtifactRefs, pendingRefsRef]);

  const handleQuickAction = useCallback(async (prompt: string) => {
    pendingRefsRef.current = [...selectedArtifactRefs];
    await sendMessage({ message: prompt, contextOverride: artifactContextOverride, stream: true });
  }, [sendMessage, artifactContextOverride, selectedArtifactRefs, pendingRefsRef]);

  return {
    handleSend,
    handleQuickAction,
  };
}
