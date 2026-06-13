'use client';

import { useEffect, useRef, useState } from 'react';
import type { ConversationMessage } from '@/modules/ai-enhance/hooks/useConversation';

interface UseMessageReferenceTrackerOptions {
  messages: ConversationMessage[];
}

interface UseMessageReferenceTrackerReturn {
  pendingRefsRef: React.MutableRefObject<string[]>;
  refsByMessageId: Record<string, string[]>;
  setRefsByMessageId: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

export function useMessageReferenceTracker({
  messages,
}: UseMessageReferenceTrackerOptions): UseMessageReferenceTrackerReturn {
  const pendingRefsRef = useRef<string[]>([]);
  const [refsByMessageId, setRefsByMessageId] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (pendingRefsRef.current.length === 0) return;
    const untracked = messages.filter(
      (message) => message.role === 'user' && !refsByMessageId[message.id]
    );
    if (untracked.length === 0) return;

    const refsToAssign = pendingRefsRef.current;
    pendingRefsRef.current = [];

    setRefsByMessageId((prev) => {
      const next = { ...prev };
      for (const message of untracked) {
        if (!next[message.id]) {
          next[message.id] = refsToAssign;
          break; // only assign to the first untracked message
        }
      }
      return next;
    });
  }, [messages, refsByMessageId]);

  return {
    pendingRefsRef,
    refsByMessageId,
    setRefsByMessageId,
  };
}
