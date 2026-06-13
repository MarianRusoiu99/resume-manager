'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatHeaderTabs } from './ChatHeaderTabs';
import { SessionSidebar } from './SessionSidebar';
import { MessageList } from './MessageList';
import { useConversation } from '@/modules/ai-enhance/hooks/useConversation';
import {
  useSessionManager,
  getMode,
  getFeature,
  getEmptyState,
  RESUME_ACTIONS,
  COVER_LETTER_ACTIONS,
  TEMPLATE_ACTIONS,
  type GenerationType,
} from '../hooks/useSessionManager';
import { useGenerationSave } from '../hooks/useGenerationSave';
import { useSessionArtifactRefs } from '../hooks/useSessionArtifactRefs';
import { useGenerationTypeRouting } from '../hooks/useGenerationTypeRouting';
import { useSessionTitleSync } from '../hooks/useSessionTitleSync';
import { useArtifactCatalog } from '../hooks/useArtifactCatalog';
import { useArtifactHydration } from '../hooks/useArtifactHydration';
import { useArtifactContextOverride } from '../hooks/useArtifactContextOverride';
import { useTemplateOutputState } from '../hooks/useTemplateOutputState';
import { useResumeOutputState } from '../hooks/useResumeOutputState';
import { useCoverLetterOutputState } from '../hooks/useCoverLetterOutputState';
import { useTemplateContextHydration } from '../hooks/useTemplateContextHydration';
import { useMessageReferenceTracker } from '../hooks/useMessageReferenceTracker';
import { useChatSendHandlers } from '../hooks/useChatSendHandlers';

interface FullPageChatProps {
  defaultType?: GenerationType;
}

export function FullPageChat({ defaultType = 'resume' }: FullPageChatProps) {
  const router = useRouter();
  const [generationType, setGenerationType] = useState<GenerationType>(defaultType);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { switchType } = useGenerationTypeRouting({
    defaultType,
    setGenerationType,
  });

  const mode = getMode(generationType);

  // ── Session management ─────────────────────────────────────────────────
  const {
    historyByType,
    isHistoryCollapsed,
    activeSessionId,
    setIsHistoryCollapsed,
    setActiveByType,
    setHistoryByType,
    handleCreateSession: _handleCreateSession,
    handleDeleteSession,
    modelByType,
  } = useSessionManager({ generationType, mode });

  const {
    selectedArtifactRefs,
    setSelectedArtifactRefs,
    clearSelectedArtifactRefs,
    removeSessionArtifactRefsKey,
  } = useSessionArtifactRefs({ activeSessionId });

  const {
    artifactOptions,
    isLoadingArtifacts,
    selectedArtifacts,
    selectedTemplateArtifact,
  } = useArtifactCatalog({
    generationType,
    selectedArtifactRefs,
    setSelectedArtifactRefs,
  });

  const { hydratedResumeRefs, hydratedProfileRefs } = useArtifactHydration({
    selectedArtifacts,
  });

  const artifactContextOverride = useArtifactContextOverride({
    generationType,
    selectedArtifacts,
    selectedTemplateArtifact,
    hydratedProfileRefs,
    hydratedResumeRefs,
  });

  const handleCreateSession = useCallback((type: GenerationType) => {
    _handleCreateSession(type);
    clearSelectedArtifactRefs();
  }, [_handleCreateSession, clearSelectedArtifactRefs]);

  const handleDeleteSessionWithRefs = useCallback((type: GenerationType, sessionId: string) => {
    handleDeleteSession(type, sessionId);
    removeSessionArtifactRefsKey(sessionId);
  }, [handleDeleteSession, removeSessionArtifactRefsKey]);

  const persistenceKey = useMemo(
    () => `fullpage-chat:${mode}:${activeSessionId}`,
    [mode, activeSessionId]
  );

  const { state, sendMessage, abort, isGenerating, updateContext } = useConversation({
    mode,
    persistenceKey,
    onComplete: () => {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.messages, state.isStreaming]);

  useSessionTitleSync({
    messages: state.messages,
    generationType,
    activeSessionId,
    setHistoryByType,
  });

  const hasMessages = state.messages.length > 0;
  const emptyState = getEmptyState(generationType);
  const actions = generationType === 'resume' ? RESUME_ACTIONS : generationType === 'cover-letter' ? COVER_LETTER_ACTIONS : TEMPLATE_ACTIONS;

  const {
    pendingRefsRef,
    refsByMessageId,
  } = useMessageReferenceTracker({
    messages: state.messages,
  });

  const {
    templatePreviewByMessage,
    setTemplatePreviewByMessage,
    templatePreviewHeightByMessage,
    setTemplatePreviewHeightByMessage,
    templatePreviewWidthByMessage,
    setTemplatePreviewWidthByMessage,
  } = useTemplateOutputState({
    generationType,
    messages: state.messages,
    selectedArtifactRefs,
  });

  const {
    resumePreviewByMessage,
    setResumePreviewByMessage,
    resumeTemplateByMessage,
  } = useResumeOutputState({
    generationType,
    messages: state.messages,
  });

  const {
    coverLetterPreviewByMessage,
    setCoverLetterPreviewByMessage,
    coverLetterShowCodeByMessage,
    setCoverLetterShowCodeByMessage,
  } = useCoverLetterOutputState({
    generationType,
    messages: state.messages,
    jobDescription: state.context?.job?.description,
  });

  useTemplateContextHydration({
    generationType,
    selectedTemplateArtifact,
    currentTemplateFromContext: state.context?.template,
    updateContext,
  });

  const { handleSend, handleQuickAction } = useChatSendHandlers({
    sendMessage,
    artifactContextOverride,
    selectedArtifactRefs,
    modelByType,
    generationType,
    pendingRefsRef,
  });

  // ── Save management ────────────────────────────────────────────────────
  const {
    isSavingTemplateByMessage,
    isSavingResumeByMessage,
    isSavingCoverLetterByMessage,
    templateSavedIdByMessage,
    handleSaveTemplateMessage,
    handleSaveResumeMessage,
    handleSaveCoverLetterMessage,
  } = useGenerationSave({
    resumePreviewByMessage,
    setResumePreviewByMessage,
    coverLetterPreviewByMessage,
    setCoverLetterPreviewByMessage,
    router,
  });

  return (
    <div className="flex h-screen bg-background">
      <SessionSidebar
        isHistoryCollapsed={isHistoryCollapsed}
        generationType={generationType}
        sessions={historyByType[generationType]}
        activeSessionId={activeSessionId}
        onToggleCollapsed={() => setIsHistoryCollapsed((prev) => !prev)}
        onCreateSession={handleCreateSession}
        onSelectSession={(sessionId) => {
          clearSelectedArtifactRefs();
          setActiveByType((prev) => ({ ...prev, [generationType]: sessionId }));
        }}
        onDeleteSession={handleDeleteSessionWithRefs}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <ChatHeaderTabs
          generationType={generationType}
          sessionCount={historyByType[generationType].length}
          onSwitchType={switchType}
        />

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div ref={scrollRef} className="w-full h-full px-4 py-6">
              {!hasMessages ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">{emptyState.title}</h2>
                    <p className="text-sm text-muted-foreground max-w-xl">{emptyState.description}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-4xl">
                    {actions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => void handleQuickAction(action.prompt)}
                        className="flex flex-col gap-1 p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/50 hover:border-primary/20 transition-all text-left"
                      >
                        <span className="text-sm font-medium text-foreground">{action.label}</span>
                        <span className="text-xs text-muted-foreground line-clamp-2">{action.prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <MessageList
                  messages={state.messages}
                  generationType={generationType}
                  isStreaming={state.isStreaming}
                  artifactOptions={artifactOptions}
                  refsByMessageId={refsByMessageId}
                  resumePreviewByMessage={resumePreviewByMessage}
                  resumeTemplateByMessage={resumeTemplateByMessage}
                  isSavingResumeByMessage={isSavingResumeByMessage}
                  coverLetterPreviewByMessage={coverLetterPreviewByMessage}
                  coverLetterShowCodeByMessage={coverLetterShowCodeByMessage}
                  isSavingCoverLetterByMessage={isSavingCoverLetterByMessage}
                  templatePreviewByMessage={templatePreviewByMessage}
                  templatePreviewWidthByMessage={templatePreviewWidthByMessage}
                  templatePreviewHeightByMessage={templatePreviewHeightByMessage}
                  templateSavedIdByMessage={templateSavedIdByMessage}
                  isSavingTemplateByMessage={isSavingTemplateByMessage}
                  onResumeTemplateChange={(messageId, templateId) => {
                    setResumePreviewByMessage((prev) => {
                      const current = prev[messageId];
                      if (!current) return prev;
                      if (current.selectedTemplateId === templateId) return prev;
                      return {
                        ...prev,
                        [messageId]: {
                          ...current,
                          selectedTemplateId: templateId,
                        },
                      };
                    });
                  }}
                  onCoverLetterToggleCode={(messageId, showCode) => {
                    setCoverLetterShowCodeByMessage((prev) => ({
                      ...prev,
                      [messageId]: showCode,
                    }));
                  }}
                  onTemplateToggleCode={(messageId, showCode) => {
                    setTemplatePreviewByMessage((prev) => ({
                      ...prev,
                      [messageId]: {
                        ...prev[messageId],
                        showCode,
                      },
                    }));
                  }}
                  onTemplatePreviewSizeChange={(messageId, size) => {
                    setTemplatePreviewWidthByMessage((prev) => {
                      if (prev[messageId] === size.width) return prev;
                      return { ...prev, [messageId]: size.width };
                    });
                    setTemplatePreviewHeightByMessage((prev) => {
                      if (prev[messageId] === size.height) return prev;
                      return { ...prev, [messageId]: size.height };
                    });
                  }}
                  onSaveResume={(messageId) => {
                    void handleSaveResumeMessage(messageId);
                  }}
                  onSaveCoverLetter={(messageId) => {
                    void handleSaveCoverLetterMessage(messageId);
                  }}
                  onSaveTemplate={(message) => {
                    void handleSaveTemplateMessage(message);
                  }}
                  onViewResume={(resumeId) => {
                    router.push(`/resumes/${resumeId}`);
                  }}
                  onViewCoverLetter={(coverLetterId) => {
                    router.push(`/cover-letters/${coverLetterId}`);
                  }}
                  onViewTemplate={(templateId) => {
                    router.push(`/templates/${templateId}`);
                  }}
                  isGenerating={isGenerating}
                  error={state.error}
                  onDismissError={abort}
                />
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="shrink-0 bg-background">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <ChatInput
              key={`${generationType}:${activeSessionId}`}
              onSend={handleSend}
              disabled={isGenerating}
              placeholder={
                generationType === 'resume'
                  ? 'Describe the job you\'re targeting, paste a job description, or upload source files...'
                  : generationType === 'cover-letter'
                    ? 'Describe the position you\'re applying for, paste/upload job details...'
                    : 'Describe the template style you want, constraints, colors, and layout...'
              }
              feature={getFeature(generationType)}
              requireModelSelection
              referenceValues={selectedArtifactRefs}
              onReferenceChange={setSelectedArtifactRefs}
              isReferenceLoading={isLoadingArtifacts}
              referencePlaceholder={generationType === 'template' ? 'Select profile/template' : 'Reference artifact (optional)'}
              referenceNoneLabel={generationType === 'template' ? 'Default profile' : 'No reference'}
              referenceOptions={artifactOptions.map((option) => ({
                value: `${option.type}:${option.id}`,
                label: option.label,
                group: generationType === 'template'
                  ? (option.type === 'profile' ? 'profiles' : option.type === 'template' ? 'templates' : 'artifacts')
                  : 'artifacts',
              }))}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
