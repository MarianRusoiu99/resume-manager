'use client';

import { ReasoningBlock } from '@/components/chat/ReasoningBlock';
import type { ConversationMessage } from '@/modules/ai-enhance/hooks/useConversation';
import type { GenerationType } from '../hooks/useSessionManager';
import type { ResumePreviewState, CoverLetterPreviewState } from '../hooks/useGenerationSave';
import { OutputRenderer } from './OutputRenderer';

interface TemplatePreviewState {
  html: string;
  showCode: boolean;
}

interface AssistantMessageContentProps {
  generationType: GenerationType;
  message: ConversationMessage;
  isStreamingLast: boolean;

  templateHtmlForMessage: string | null;
  shouldHideTemplateRawMessage: boolean;
  shouldHideResumeRawMessage: boolean;
  shouldHideCoverLetterRawMessage: boolean;

  resumePreview?: ResumePreviewState;
  resumeTemplateHtml?: string;
  isSavingResume: boolean;
  onResumeTemplateChange: (messageId: string, templateId: string | null) => void;
  onSaveResume: (messageId: string) => void;
  onViewResume: (resumeId: string) => void;

  coverLetterPreview?: CoverLetterPreviewState;
  coverLetterShowCode: boolean;
  isSavingCoverLetter: boolean;
  onCoverLetterToggleCode: (messageId: string, showCode: boolean) => void;
  onSaveCoverLetter: (messageId: string) => void;
  onViewCoverLetter: (coverLetterId: string) => void;

  templatePreview?: TemplatePreviewState;
  templatePreviewWidth?: number;
  templatePreviewHeight?: number;
  templateSavedId?: string;
  isSavingTemplate: boolean;
  onTemplateToggleCode: (messageId: string, showCode: boolean) => void;
  onTemplatePreviewSizeChange: (messageId: string, size: { width: number; height: number }) => void;
  onSaveTemplate: (message: ConversationMessage) => void;
  onViewTemplate: (templateId: string) => void;
}

export function AssistantMessageContent({
  generationType,
  message,
  isStreamingLast,
  templateHtmlForMessage,
  shouldHideTemplateRawMessage,
  shouldHideResumeRawMessage,
  shouldHideCoverLetterRawMessage,
  resumePreview,
  resumeTemplateHtml,
  isSavingResume,
  onResumeTemplateChange,
  onSaveResume,
  onViewResume,
  coverLetterPreview,
  coverLetterShowCode,
  isSavingCoverLetter,
  onCoverLetterToggleCode,
  onSaveCoverLetter,
  onViewCoverLetter,
  templatePreview,
  templatePreviewWidth,
  templatePreviewHeight,
  templateSavedId,
  isSavingTemplate,
  onTemplateToggleCode,
  onTemplatePreviewSizeChange,
  onSaveTemplate,
  onViewTemplate,
}: AssistantMessageContentProps) {
  return (
    <>
      {!shouldHideTemplateRawMessage && !shouldHideResumeRawMessage && !shouldHideCoverLetterRawMessage && (
        <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed bg-muted text-foreground rounded-bl-md">
          {isStreamingLast && !message.content ? (
            <div className="flex items-center gap-1.5 py-1">
              <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
      )}

      {message.thinking && (
        <ReasoningBlock thinking={message.thinking} isStreaming={isStreamingLast && !message.output} />
      )}

      <OutputRenderer
        generationType={generationType}
        message={message}
        templateHtmlForMessage={templateHtmlForMessage}
        resumePreview={resumePreview}
        resumeTemplateHtml={resumeTemplateHtml}
        isSavingResume={isSavingResume}
        onResumeTemplateChange={onResumeTemplateChange}
        onSaveResume={onSaveResume}
        onViewResume={onViewResume}
        coverLetterPreview={coverLetterPreview}
        coverLetterShowCode={coverLetterShowCode}
        isSavingCoverLetter={isSavingCoverLetter}
        onCoverLetterToggleCode={onCoverLetterToggleCode}
        onSaveCoverLetter={onSaveCoverLetter}
        onViewCoverLetter={onViewCoverLetter}
        templatePreview={templatePreview}
        templatePreviewWidth={templatePreviewWidth}
        templatePreviewHeight={templatePreviewHeight}
        templateSavedId={templateSavedId}
        isSavingTemplate={isSavingTemplate}
        onTemplateToggleCode={onTemplateToggleCode}
        onTemplatePreviewSizeChange={onTemplatePreviewSizeChange}
        onSaveTemplate={onSaveTemplate}
        onViewTemplate={onViewTemplate}
      />
    </>
  );
}
