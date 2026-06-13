'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { ConversationMessage } from '@/modules/ai-enhance/hooks/useConversation';
import type { GenerationType } from './useSessionManager';
import { extractCoverLetterOutput } from '../utils/extract-output';
import type { CoverLetterPreviewState } from './useGenerationSave';

interface UseCoverLetterOutputStateOptions {
  generationType: GenerationType;
  messages: ConversationMessage[];
  jobDescription?: string;
}

interface UseCoverLetterOutputStateReturn {
  coverLetterPreviewByMessage: Record<string, CoverLetterPreviewState>;
  setCoverLetterPreviewByMessage: Dispatch<SetStateAction<Record<string, CoverLetterPreviewState>>>;
  coverLetterShowCodeByMessage: Record<string, boolean>;
  setCoverLetterShowCodeByMessage: Dispatch<SetStateAction<Record<string, boolean>>>;
}

export function useCoverLetterOutputState({
  generationType,
  messages,
  jobDescription,
}: UseCoverLetterOutputStateOptions): UseCoverLetterOutputStateReturn {
  const [coverLetterPreviewByMessage, setCoverLetterPreviewByMessage] = useState<Record<string, CoverLetterPreviewState>>({});
  const [coverLetterShowCodeByMessage, setCoverLetterShowCodeByMessage] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (generationType !== 'cover-letter') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCoverLetterPreviewByMessage((prev) => (Object.keys(prev).length > 0 ? {} : prev));
      setCoverLetterShowCodeByMessage((prev) => (Object.keys(prev).length > 0 ? {} : prev));
      return;
    }

    const assistantMessages = messages.filter((message) => message.role === 'assistant');
    if (assistantMessages.length === 0) return;

    setCoverLetterPreviewByMessage((prev) => {
      const next = { ...prev };
      let changed = false;

      for (const message of assistantMessages) {
        const extracted = extractCoverLetterOutput(message);
        if (!extracted?.content) continue;

        const existing = next[message.id];
        if (existing) {
          if (
            existing.content === extracted.content
            && existing.jobDescription === (jobDescription || '')
            && existing.jobTitle === extracted.jobTitle
            && existing.companyName === extracted.companyName
          ) {
            continue;
          }

          next[message.id] = {
            ...existing,
            content: extracted.content,
            jobDescription: jobDescription || '',
            jobTitle: extracted.jobTitle,
            companyName: extracted.companyName,
          };
          changed = true;
          continue;
        }

        next[message.id] = {
          content: extracted.content,
          jobDescription: jobDescription || '',
          jobTitle: extracted.jobTitle,
          companyName: extracted.companyName,
        };
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [generationType, messages, jobDescription]);

  return {
    coverLetterPreviewByMessage,
    setCoverLetterPreviewByMessage,
    coverLetterShowCodeByMessage,
    setCoverLetterShowCodeByMessage,
  };
}
