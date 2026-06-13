'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { fetchTemplate, fetchTemplates } from '../adapters/artifact-actions';
import type { ConversationMessage } from '@/modules/ai-enhance/hooks/useConversation';
import type { GenerationType } from './useSessionManager';
import { extractResumeData } from '../utils/extract-output';
import type { ResumePreviewState } from './useGenerationSave';

interface ResumeTemplateState {
  templateId: string;
  htmlTemplate: string;
}

interface UseResumeOutputStateOptions {
  generationType: GenerationType;
  messages: ConversationMessage[];
}

interface UseResumeOutputStateReturn {
  resumePreviewByMessage: Record<string, ResumePreviewState>;
  setResumePreviewByMessage: Dispatch<SetStateAction<Record<string, ResumePreviewState>>>;
  resumeTemplateByMessage: Record<string, ResumeTemplateState>;
}

export function useResumeOutputState({
  generationType,
  messages,
}: UseResumeOutputStateOptions): UseResumeOutputStateReturn {
  const [resumePreviewByMessage, setResumePreviewByMessage] = useState<Record<string, ResumePreviewState>>({});
  const [resumeDefaultTemplateId, setResumeDefaultTemplateId] = useState<string | null>(null);
  const [resumeTemplateByMessage, setResumeTemplateByMessage] = useState<Record<string, ResumeTemplateState>>({});

  useEffect(() => {
    let cancelled = false;

    const loadResumeDefaultTemplate = async () => {
      const result = await fetchTemplates();
      if (cancelled) return;
      if (!result.success || !result.data || result.data.length === 0) {
        setResumeDefaultTemplateId(null);
        return;
      }

      const defaultTemplate = result.data[0];
      setResumeDefaultTemplateId(defaultTemplate.id);
    };

    void loadResumeDefaultTemplate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (generationType !== 'resume') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResumePreviewByMessage((prev) => (Object.keys(prev).length > 0 ? {} : prev));
      setResumeTemplateByMessage((prev) => (Object.keys(prev).length > 0 ? {} : prev));
      return;
    }

    const assistantResumeMessages = messages.filter((message) => message.role === 'assistant');
    if (assistantResumeMessages.length === 0) return;

    setResumePreviewByMessage((prev) => {
      const next = { ...prev };
      let changed = false;

      for (const message of assistantResumeMessages) {
        if (next[message.id]) continue;

        const resumeData = extractResumeData(message);
        if (!resumeData) continue;

        next[message.id] = {
          resumeData,
          selectedTemplateId: resumeDefaultTemplateId,
        };
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [generationType, messages, resumeDefaultTemplateId]);

  useEffect(() => {
    if (!resumeDefaultTemplateId) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResumePreviewByMessage((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [messageId, preview] of Object.entries(prev)) {
        if (preview.selectedTemplateId) continue;
        next[messageId] = {
          ...preview,
          selectedTemplateId: resumeDefaultTemplateId,
        };
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [resumeDefaultTemplateId]);

  useEffect(() => {
    if (generationType !== 'resume') return;

    const entries = Object.entries(resumePreviewByMessage);
    const missing = entries.filter(([messageId, preview]) => {
      if (!preview.selectedTemplateId) return false;
      const cached = resumeTemplateByMessage[messageId];
      return !cached || cached.templateId !== preview.selectedTemplateId;
    });
    if (missing.length === 0) return;

    let cancelled = false;
    const fetchMissing = async () => {
      for (const [messageId, preview] of missing) {
        if (!preview.selectedTemplateId) continue;
        const result = await fetchTemplate(preview.selectedTemplateId);
        if (cancelled) return;
        if (!result.success || !result.data?.htmlTemplate) continue;
        setResumeTemplateByMessage((prev) => ({
          ...prev,
          [messageId]: {
            templateId: preview.selectedTemplateId!,
            htmlTemplate: result.data.htmlTemplate,
          },
        }));
      }
    };

    void fetchMissing();
    return () => {
      cancelled = true;
    };
  }, [generationType, resumePreviewByMessage, resumeTemplateByMessage]);

  return {
    resumePreviewByMessage,
    setResumePreviewByMessage,
    resumeTemplateByMessage,
  };
}
