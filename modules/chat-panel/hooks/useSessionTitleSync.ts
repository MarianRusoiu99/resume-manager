'use client';

import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { ConversationMessage } from '@/modules/ai-enhance/hooks/useConversation';
import {
  truncateTitle,
  type GenerationType,
  type SessionHistoryByType,
  type SessionMeta,
} from './useSessionManager';

interface UseSessionTitleSyncOptions {
  messages: ConversationMessage[];
  generationType: GenerationType;
  activeSessionId: string;
  setHistoryByType: Dispatch<SetStateAction<SessionHistoryByType>>;
}

export function useSessionTitleSync({
  messages,
  generationType,
  activeSessionId,
  setHistoryByType,
}: UseSessionTitleSyncOptions): void {
  useEffect(() => {
    const firstUserMessage = messages.find((m) => m.role === 'user' && m.content.trim().length > 0);
    const nextTitle = firstUserMessage
      ? truncateTitle(firstUserMessage.content)
      : (generationType === 'resume'
        ? 'New resume chat'
        : generationType === 'cover-letter'
          ? 'New cover letter chat'
          : 'New template chat');

    setHistoryByType((prev) => {
      const current = prev[generationType];
      const idx = current.findIndex((s) => s.id === activeSessionId);
      if (idx === -1) return prev;

      const updatedSession: SessionMeta = {
        ...current[idx],
        title: nextTitle,
        updatedAt: Date.now(),
      };

      const reordered = [updatedSession, ...current.filter((s) => s.id !== activeSessionId)];
      return {
        ...prev,
        [generationType]: reordered,
      };
    });
  }, [messages, generationType, activeSessionId, setHistoryByType]);
}
