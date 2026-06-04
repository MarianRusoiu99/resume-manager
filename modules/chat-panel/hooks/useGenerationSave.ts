'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createTemplate } from '@/app/actions/template';
import { saveGeneratedResume } from '@/app/actions/resume';
import { createCoverLetter } from '@/app/actions/cover-letter';
import { extractTemplateHtml } from '../utils/extract-output';
import { toast } from 'sonner';
import type { ConversationMessage } from '@/modules/ai-enhance/hooks/useConversation';
import type { Resume } from '@/lib/validations/jsonresume';

export interface ResumePreviewState {
  resumeData: Resume;
  selectedTemplateId: string | null;
  savedResumeId?: string;
}

export interface CoverLetterPreviewState {
  content: string;
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  savedCoverLetterId?: string;
}

export interface UseGenerationSaveOptions {
  resumePreviewByMessage: Record<string, ResumePreviewState>;
  setResumePreviewByMessage: React.Dispatch<React.SetStateAction<Record<string, ResumePreviewState>>>;
  coverLetterPreviewByMessage: Record<string, CoverLetterPreviewState>;
  setCoverLetterPreviewByMessage: React.Dispatch<React.SetStateAction<Record<string, CoverLetterPreviewState>>>;
  router: ReturnType<typeof useRouter>;
}

export interface UseGenerationSaveReturn {
  isSavingTemplateByMessage: Record<string, boolean>;
  isSavingResumeByMessage: Record<string, boolean>;
  isSavingCoverLetterByMessage: Record<string, boolean>;
  templateSavedIdByMessage: Record<string, string>;
  handleSaveTemplateMessage: (message: ConversationMessage) => Promise<void>;
  handleSaveResumeMessage: (messageId: string) => Promise<void>;
  handleSaveCoverLetterMessage: (messageId: string) => Promise<void>;
}

export function useGenerationSave(options: UseGenerationSaveOptions): UseGenerationSaveReturn {
  const {
    resumePreviewByMessage,
    setResumePreviewByMessage,
    coverLetterPreviewByMessage,
    setCoverLetterPreviewByMessage,
    router,
  } = options;

  const [isSavingTemplateByMessage, setIsSavingTemplateByMessage] = useState<Record<string, boolean>>({});
  const [isSavingResumeByMessage, setIsSavingResumeByMessage] = useState<Record<string, boolean>>({});
  const [isSavingCoverLetterByMessage, setIsSavingCoverLetterByMessage] = useState<Record<string, boolean>>({});
  const [templateSavedIdByMessage, setTemplateSavedIdByMessage] = useState<Record<string, string>>({});

  const handleSaveTemplateMessage = useCallback(async (message: ConversationMessage) => {
    const messageId = message.id;

    // If already saved, navigate to it (View behaviour)
    if (templateSavedIdByMessage[messageId]) {
      router.push(`/templates/${templateSavedIdByMessage[messageId]}`);
      return;
    }

    const htmlTemplate = extractTemplateHtml(message);
    if (!htmlTemplate) {
      toast.error('No template code found in this message.');
      return;
    }

    setIsSavingTemplateByMessage((prev) => ({ ...prev, [messageId]: true }));

    try {
      const defaultName = `AI Template ${new Date().toLocaleDateString()}`;
      const result = await createTemplate({
        name: defaultName,
        description: 'Saved from template generation chat',
        htmlTemplate,
        isPublic: false,
      });

      if (!result.success || !result.data) {
        toast.error('Failed to save template');
        return;
      }

      setTemplateSavedIdByMessage((prev) => ({ ...prev, [messageId]: result.data.id }));
      toast.success('Template saved');
    } catch {
      toast.error('Failed to save template');
    } finally {
      setIsSavingTemplateByMessage((prev) => ({ ...prev, [messageId]: false }));
    }
  }, [router, templateSavedIdByMessage]);

  const handleSaveResumeMessage = useCallback(async (messageId: string) => {
    const preview = resumePreviewByMessage[messageId];
    if (!preview) {
      toast.error('No resume data found for this message.');
      return;
    }

    if (preview.savedResumeId) {
      router.push(`/resumes/${preview.savedResumeId}`);
      return;
    }

    setIsSavingResumeByMessage((prev) => ({ ...prev, [messageId]: true }));

    try {
      const result = await saveGeneratedResume({
        resume: preview.resumeData,
        jobDescription: 'Generated from chat session',
        templateId: preview.selectedTemplateId ?? undefined,
        metadata: {
          source: 'generate-chat',
          generationType: 'resume',
        },
      });

      if (!result.success || !result.data?.id) {
        toast.error('Failed to save resume');
        return;
      }

      setResumePreviewByMessage((prev) => {
        const current = prev[messageId];
        if (!current) return prev;
        return {
          ...prev,
          [messageId]: {
            ...current,
            savedResumeId: result.data.id,
          },
        };
      });

      toast.success('Resume saved');
    } catch {
      toast.error('Failed to save resume');
    } finally {
      setIsSavingResumeByMessage((prev) => ({ ...prev, [messageId]: false }));
    }
  }, [resumePreviewByMessage, router, setResumePreviewByMessage]);

  const handleSaveCoverLetterMessage = useCallback(async (messageId: string) => {
    const preview = coverLetterPreviewByMessage[messageId];
    if (!preview) {
      toast.error('No cover letter found for this message.');
      return;
    }

    if (preview.savedCoverLetterId) {
      router.push(`/cover-letters/${preview.savedCoverLetterId}`);
      return;
    }

    setIsSavingCoverLetterByMessage((prev) => ({ ...prev, [messageId]: true }));

    try {
      const result = await createCoverLetter(
        preview.content,
        preview.jobDescription || 'Generated from chat session',
        preview.jobTitle,
        preview.companyName,
        {
          jobDescription: preview.jobDescription || 'Generated from chat session',
          jobTitle: preview.jobTitle,
          companyName: preview.companyName,
        }
      );

      if (!result.success || !result.data?.id) {
        toast.error('Failed to save cover letter');
        return;
      }

      setCoverLetterPreviewByMessage((prev) => {
        const current = prev[messageId];
        if (!current) return prev;
        return {
          ...prev,
          [messageId]: {
            ...current,
            savedCoverLetterId: result.data.id,
          },
        };
      });

      toast.success('Cover letter saved');
    } catch {
      toast.error('Failed to save cover letter');
    } finally {
      setIsSavingCoverLetterByMessage((prev) => ({ ...prev, [messageId]: false }));
    }
  }, [coverLetterPreviewByMessage, router, setCoverLetterPreviewByMessage]);

  return {
    isSavingTemplateByMessage,
    isSavingResumeByMessage,
    isSavingCoverLetterByMessage,
    templateSavedIdByMessage,
    handleSaveTemplateMessage,
    handleSaveResumeMessage,
    handleSaveCoverLetterMessage,
  };
}
