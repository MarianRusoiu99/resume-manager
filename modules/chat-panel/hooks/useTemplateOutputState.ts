'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { renderTemplateServerSide } from '@/components/core/data-display/rendering/client-renderer';
import { sampleResume } from '@/lib/templates/constants/sample-resume';
import { fetchProfile, fetchProfiles } from '../adapters/artifact-actions';
import type { Resume } from '@/lib/validations/jsonresume';
import type { ConversationMessage } from '@/modules/ai-enhance/hooks/useConversation';
import type { GenerationType } from './useSessionManager';
import { extractTemplateHtml } from '../utils/extract-output';

interface TemplatePreviewState {
  html: string;
  showCode: boolean;
}

interface UseTemplateOutputStateOptions {
  generationType: GenerationType;
  messages: ConversationMessage[];
  selectedArtifactRefs: string[];
}

interface UseTemplateOutputStateReturn {
  templatePreviewByMessage: Record<string, TemplatePreviewState>;
  setTemplatePreviewByMessage: Dispatch<SetStateAction<Record<string, TemplatePreviewState>>>;
  templatePreviewHeightByMessage: Record<string, number>;
  setTemplatePreviewHeightByMessage: Dispatch<SetStateAction<Record<string, number>>>;
  templatePreviewWidthByMessage: Record<string, number>;
  setTemplatePreviewWidthByMessage: Dispatch<SetStateAction<Record<string, number>>>;
}

export function useTemplateOutputState({
  generationType,
  messages,
  selectedArtifactRefs,
}: UseTemplateOutputStateOptions): UseTemplateOutputStateReturn {
  const [templatePreviewByMessage, setTemplatePreviewByMessage] = useState<Record<string, TemplatePreviewState>>({});
  const [templatePreviewHeightByMessage, setTemplatePreviewHeightByMessage] = useState<Record<string, number>>({});
  const [templatePreviewWidthByMessage, setTemplatePreviewWidthByMessage] = useState<Record<string, number>>({});
  const [templatePreviewResume, setTemplatePreviewResume] = useState<Resume>(sampleResume as Resume);

  useEffect(() => {
    let cancelled = false;

    const loadTemplatePreviewResume = async () => {
      if (generationType !== 'template') return;

      const selectedProfileRef = selectedArtifactRefs.find((ref) => ref.startsWith('profile:'));
      const profileRef = selectedProfileRef ? selectedProfileRef.split(':')[1] : null;
      if (profileRef) {
        const profileResult = await fetchProfile(profileRef);
        if (cancelled) return;
        if (profileResult.success && profileResult.data?.resume) {
          setTemplatePreviewResume(profileResult.data.resume as Resume);
          return;
        }
      }

      const profilesResult = await fetchProfiles();
      if (cancelled) return;
      if (profilesResult.success && profilesResult.data && profilesResult.data.length > 0) {
        const defaultProfile = profilesResult.data.find((p) => p.isDefault) ?? profilesResult.data[0];
        if (!defaultProfile) {
          setTemplatePreviewResume(sampleResume as Resume);
          return;
        }
        const defaultProfileResult = await fetchProfile(defaultProfile.id);
        if (cancelled) return;
        if (defaultProfileResult.success && defaultProfileResult.data?.resume) {
          setTemplatePreviewResume(defaultProfileResult.data.resume as Resume);
          return;
        }
      }

      setTemplatePreviewResume(sampleResume as Resume);
    };

    void loadTemplatePreviewResume();

    return () => {
      cancelled = true;
    };
  }, [generationType, selectedArtifactRefs]);

  useEffect(() => {
    if (generationType !== 'template') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTemplatePreviewByMessage((prev) => (Object.keys(prev).length > 0 ? {} : prev));
      setTemplatePreviewHeightByMessage((prev) => (Object.keys(prev).length > 0 ? {} : prev));
      setTemplatePreviewWidthByMessage((prev) => (Object.keys(prev).length > 0 ? {} : prev));
      return;
    }

    const assistantTemplateMessages = messages.filter((m) => m.role === 'assistant');
    if (assistantTemplateMessages.length === 0) return;

    let cancelled = false;

    const processMissingPreviews = async () => {
      const updates: Array<{ id: string; html: string; showCode: boolean }> = [];

      for (const message of assistantTemplateMessages) {
        if (templatePreviewByMessage[message.id]) continue;

        const htmlTemplate = extractTemplateHtml(message);
        if (!htmlTemplate) continue;

        try {
          const html = await renderTemplateServerSide({
            htmlTemplate,
            resumeData: templatePreviewResume,
          });
          if (cancelled) return;
          updates.push({ id: message.id, html, showCode: false });
        } catch {
          if (cancelled) return;
          updates.push({ id: message.id, html: '', showCode: true });
        }
      }

      if (cancelled || updates.length === 0) return;

      setTemplatePreviewByMessage((prev) => {
        const next = { ...prev };
        let changed = false;

        for (const update of updates) {
          if (next[update.id]) continue;
          next[update.id] = { html: update.html, showCode: update.showCode };
          changed = true;
        }

        return changed ? next : prev;
      });
    };

    void processMissingPreviews();

    return () => {
      cancelled = true;
    };
  }, [messages, generationType, templatePreviewByMessage, templatePreviewResume]);

  return {
    templatePreviewByMessage,
    setTemplatePreviewByMessage,
    templatePreviewHeightByMessage,
    setTemplatePreviewHeightByMessage,
    templatePreviewWidthByMessage,
    setTemplatePreviewWidthByMessage,
  };
}
