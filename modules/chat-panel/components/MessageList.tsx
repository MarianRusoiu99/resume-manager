'use client';

import { cn } from '@/lib/utils';
import type { ConversationMessage } from '@/modules/ai-enhance/hooks/useConversation';
import type { ArtifactReference } from '../hooks/useArtifactCatalog';
import type { GenerationType } from '../hooks/useSessionManager';
import type { ResumePreviewState, CoverLetterPreviewState } from '../hooks/useGenerationSave';
import { extractTemplateHtml } from '../utils/extract-output';
import { AssistantMessageContent } from './AssistantMessageContent';

interface TemplatePreviewState {
  html: string;
  showCode: boolean;
}

interface MessageListProps {
  messages: ConversationMessage[];
  generationType: GenerationType;
  isStreaming: boolean;

  artifactOptions: ArtifactReference[];
  refsByMessageId: Record<string, string[]>;

  resumePreviewByMessage: Record<string, ResumePreviewState>;
  resumeTemplateByMessage: Record<string, { templateId: string; htmlTemplate: string }>;
  isSavingResumeByMessage: Record<string, boolean>;

  coverLetterPreviewByMessage: Record<string, CoverLetterPreviewState>;
  coverLetterShowCodeByMessage: Record<string, boolean>;
  isSavingCoverLetterByMessage: Record<string, boolean>;

  templatePreviewByMessage: Record<string, TemplatePreviewState>;
  templatePreviewWidthByMessage: Record<string, number>;
  templatePreviewHeightByMessage: Record<string, number>;
  templateSavedIdByMessage: Record<string, string>;
  isSavingTemplateByMessage: Record<string, boolean>;

  onResumeTemplateChange: (messageId: string, templateId: string | null) => void;
  onCoverLetterToggleCode: (messageId: string, showCode: boolean) => void;
  onTemplateToggleCode: (messageId: string, showCode: boolean) => void;
  onTemplatePreviewSizeChange: (messageId: string, size: { width: number; height: number }) => void;

  onSaveResume: (messageId: string) => void;
  onSaveCoverLetter: (messageId: string) => void;
  onSaveTemplate: (message: ConversationMessage) => void;

  onViewResume: (resumeId: string) => void;
  onViewCoverLetter: (coverLetterId: string) => void;
  onViewTemplate: (templateId: string) => void;

  isGenerating: boolean;
  error: string | null;
  onDismissError: () => void;
}

export function MessageList({
  messages,
  generationType,
  isStreaming,
  artifactOptions,
  refsByMessageId,
  resumePreviewByMessage,
  resumeTemplateByMessage,
  isSavingResumeByMessage,
  coverLetterPreviewByMessage,
  coverLetterShowCodeByMessage,
  isSavingCoverLetterByMessage,
  templatePreviewByMessage,
  templatePreviewWidthByMessage,
  templatePreviewHeightByMessage,
  templateSavedIdByMessage,
  isSavingTemplateByMessage,
  onResumeTemplateChange,
  onCoverLetterToggleCode,
  onTemplateToggleCode,
  onTemplatePreviewSizeChange,
  onSaveResume,
  onSaveCoverLetter,
  onSaveTemplate,
  onViewResume,
  onViewCoverLetter,
  onViewTemplate,
  isGenerating,
  error,
  onDismissError,
}: MessageListProps) {
  return (
    <div className="flex flex-col gap-6 pb-4">
      {messages.map((message, index) => {
        const isUser = message.role === 'user';
        const isLastAssistant = !isUser && index === messages.length - 1;
        const isStreamingLast = isLastAssistant && isStreaming;
        const templateHtmlForMessage = !isUser && generationType === 'template' ? extractTemplateHtml(message) : null;
        const shouldHideTemplateRawMessage = !isUser && generationType === 'template' && !!templateHtmlForMessage;
        const resumePreview = !isUser && generationType === 'resume' ? resumePreviewByMessage[message.id] : undefined;
        const shouldHideResumeRawMessage = !isUser && generationType === 'resume' && !!resumePreview;
        const coverLetterPreview = !isUser && generationType === 'cover-letter' ? coverLetterPreviewByMessage[message.id] : undefined;
        const shouldHideCoverLetterRawMessage = !isUser && generationType === 'cover-letter' && !!coverLetterPreview;

        return (
          <div key={message.id} className={cn('w-full flex gap-4', isUser ? 'justify-end' : 'justify-start')}>
            {!isUser && (
              <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-primary">AI</span>
              </div>
            )}

            <div className={cn('w-full space-y-2', isUser && 'max-w-[95%] flex flex-col items-end')}>
              {isUser && message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap justify-end gap-1.5">
                  {message.attachments.map((att, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                      title={att.name}
                    >
                      <span className="size-2.5 shrink-0">
                        {att.type === 'image' ? '🖼' : '📄'}
                      </span>
                      <span className="max-w-[160px] truncate">{att.name}</span>
                    </span>
                  ))}
                </div>
              )}

              {isUser && refsByMessageId[message.id] && refsByMessageId[message.id].length > 0 && (
                <div className="flex flex-wrap justify-end gap-1.5">
                  {refsByMessageId[message.id].map((ref) => {
                    const option = artifactOptions.find((opt) => `${opt.type}:${opt.id}` === ref);
                    if (!option) return null;
                    return (
                      <span
                        key={ref}
                        className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                        title={option.label}
                      >
                        <span className="size-2.5 shrink-0">🔗</span>
                        <span className="max-w-[160px] truncate">{option.label}</span>
                      </span>
                    );
                  })}
                </div>
              )}

              {isUser ? (
                <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed bg-primary text-primary-foreground rounded-br-md">
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
              ) : (
                <AssistantMessageContent
                  generationType={generationType}
                  message={message}
                  isStreamingLast={isStreamingLast}
                  templateHtmlForMessage={templateHtmlForMessage}
                  shouldHideTemplateRawMessage={shouldHideTemplateRawMessage}
                  shouldHideResumeRawMessage={shouldHideResumeRawMessage}
                  shouldHideCoverLetterRawMessage={shouldHideCoverLetterRawMessage}
                  resumePreview={resumePreview}
                  resumeTemplateHtml={resumeTemplateByMessage[message.id]?.htmlTemplate}
                  isSavingResume={!!isSavingResumeByMessage[message.id]}
                  onResumeTemplateChange={onResumeTemplateChange}
                  onSaveResume={onSaveResume}
                  onViewResume={onViewResume}
                  coverLetterPreview={coverLetterPreview}
                  coverLetterShowCode={!!coverLetterShowCodeByMessage[message.id]}
                  isSavingCoverLetter={!!isSavingCoverLetterByMessage[message.id]}
                  onCoverLetterToggleCode={onCoverLetterToggleCode}
                  onSaveCoverLetter={onSaveCoverLetter}
                  onViewCoverLetter={onViewCoverLetter}
                  templatePreview={templatePreviewByMessage[message.id]}
                  templatePreviewWidth={templatePreviewWidthByMessage[message.id]}
                  templatePreviewHeight={templatePreviewHeightByMessage[message.id]}
                  templateSavedId={templateSavedIdByMessage[message.id]}
                  isSavingTemplate={!!isSavingTemplateByMessage[message.id]}
                  onTemplateToggleCode={onTemplateToggleCode}
                  onTemplatePreviewSizeChange={onTemplatePreviewSizeChange}
                  onSaveTemplate={onSaveTemplate}
                  onViewTemplate={onViewTemplate}
                />
              )}

              <span className="px-1 text-[10px] text-muted-foreground/50">
                {message.timestamp instanceof Date
                  ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        );
      })}

      {isGenerating && messages[messages.length - 1]?.role === 'user' && (
        <div className="w-full flex gap-4 justify-start">
          <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
            <span className="text-xs font-bold text-primary">AI</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <span className="flex-1">{error}</span>
          <button type="button" onClick={onDismissError} className="text-xs underline hover:no-underline">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
