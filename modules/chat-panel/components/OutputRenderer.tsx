'use client';

import type { ConversationMessage } from '@/modules/ai-enhance/hooks/useConversation';
import { PreviewTemplateSelector } from '@/modules/templates/components/PreviewTemplateSelector';
import { ResumePreview } from '@/modules/resume/components/ResumePreview';
import { MarkdownPreview } from '@/modules/editor/components/MarkdownPreview';
import {
  GenerationOutputCard,
  SaveButton,
  ViewButton,
  PreviewCodeToggle,
  IframePreview,
  CodeBlock,
} from './GenerationOutputCard';
import type { GenerationType } from '../hooks/useSessionManager';
import type { ResumePreviewState, CoverLetterPreviewState } from '../hooks/useGenerationSave';

interface TemplatePreviewState {
  html: string;
  showCode: boolean;
}

interface OutputRendererProps {
  generationType: GenerationType;
  message: ConversationMessage;
  templateHtmlForMessage: string | null;

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

export function OutputRenderer({
  generationType,
  message,
  templateHtmlForMessage,
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
}: OutputRendererProps) {
  if (message.output == null) return null;

  const isTemplatePreviewActive =
    generationType === 'template'
    && !!templatePreview
    && !templatePreview.showCode
    && !!templatePreview.html;

  return (
    <GenerationOutputCard
      label={
        generationType === 'resume'
          ? 'Generated Resume'
          : generationType === 'cover-letter'
            ? 'Generated Cover Letter'
            : 'Generated Template'
      }
      wide={isTemplatePreviewActive}
      headerActions={
        <>
          {generationType === 'resume' && resumePreview && (
            <>
              <PreviewTemplateSelector
                selectedTemplateId={resumePreview.selectedTemplateId}
                onTemplateChange={(templateId) => onResumeTemplateChange(message.id, templateId)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 shrink-0"
              />
              {!resumePreview.savedResumeId ? (
                <SaveButton
                  onClick={() => onSaveResume(message.id)}
                  disabled={isSavingResume}
                  loading={isSavingResume}
                />
              ) : (
                <ViewButton onClick={() => onViewResume(resumePreview.savedResumeId!)} />
              )}
            </>
          )}

          {generationType === 'cover-letter' && coverLetterPreview && (
            <>
              <PreviewCodeToggle
                showCode={coverLetterShowCode}
                onToggle={(showCode) => onCoverLetterToggleCode(message.id, showCode)}
              />
              {!coverLetterPreview.savedCoverLetterId ? (
                <SaveButton
                  onClick={() => onSaveCoverLetter(message.id)}
                  disabled={isSavingCoverLetter}
                  loading={isSavingCoverLetter}
                />
              ) : (
                <ViewButton onClick={() => onViewCoverLetter(coverLetterPreview.savedCoverLetterId!)} />
              )}
            </>
          )}

          {generationType === 'template' && templatePreview && (
            <>
              <PreviewCodeToggle
                showCode={templatePreview.showCode}
                onToggle={(showCode) => onTemplateToggleCode(message.id, showCode)}
              />
              {templateSavedId ? (
                <ViewButton onClick={() => onViewTemplate(templateSavedId)} />
              ) : (
                <SaveButton
                  onClick={() => onSaveTemplate(message)}
                  disabled={isSavingTemplate}
                  loading={isSavingTemplate}
                />
              )}
            </>
          )}
        </>
      }
    >
      {generationType === 'resume' && resumePreview ? (
        <div className="p-3">
          <div className="h-[720px] w-full rounded-lg overflow-hidden bg-muted/20">
            <ResumePreview
              resumeData={resumePreview.resumeData}
              showHeader={false}
              showCard={false}
              disableScaling={false}
              templateHtml={resumeTemplateHtml}
              className="h-full w-full"
              onTemplateChange={() => {
                // selection managed via header selector
              }}
              key={`${message.id}:${resumePreview.selectedTemplateId ?? 'default'}`}
            />
          </div>
        </div>
      ) : null}

      {generationType === 'cover-letter' && coverLetterPreview ? (
        <div className="p-3">
          {coverLetterShowCode ? (
            <CodeBlock>{coverLetterPreview.content}</CodeBlock>
          ) : (
            <div className="h-[720px] w-full rounded-lg overflow-auto bg-muted/20 p-6">
              <MarkdownPreview content={coverLetterPreview.content} />
            </div>
          )}
        </div>
      ) : null}

      {generationType === 'template' && templatePreview ? (
        !templatePreview.showCode && templatePreview.html ? (
          <div className="p-3">
            <div className="h-[720px] w-full rounded-lg overflow-hidden bg-muted/20">
              <IframePreview
                srcDoc={templatePreview.html}
                width={templatePreviewWidth}
                height={templatePreviewHeight}
                onSizeChange={(size) => onTemplatePreviewSizeChange(message.id, size)}
              />
            </div>
          </div>
        ) : (
          <div className="p-3">
            <CodeBlock>
              {templateHtmlForMessage ?? String(typeof message.output === 'string' ? message.output : JSON.stringify(message.output, null, 2))}
            </CodeBlock>
          </div>
        )
      ) : null}

      {!resumePreview && !coverLetterPreview && !(generationType === 'template' && templatePreview) && (
        <CodeBlock>
          {String(typeof message.output === 'string' ? message.output : JSON.stringify(message.output, null, 2))}
        </CodeBlock>
      )}
    </GenerationOutputCard>
  );
}
