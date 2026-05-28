'use client';

import { useEffect, useRef, useCallback } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  useConversation,
  type ConversationMode,
  type ConversationContext,
  type ConversationAttachment,
} from '@/modules/ai-enhance/hooks/useConversation';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatTrigger } from './ChatTrigger';
import type { AIFeature } from '@/lib/types/ai-settings';

interface ChatPanelProps<T = unknown> {
  mode: ConversationMode;
  context: ConversationContext;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onOutput?: (output: T, savedId?: string | null) => void;
  className?: string;
  title?: string;
  placeholder?: string;
}

function getFeatureFromMode(mode: ConversationMode): AIFeature {
  if (mode === 'cover-letter-generation') return 'coverLetter';
  if (mode === 'template-generation' || mode === 'template-enhancement') return 'template';
  if (mode === 'text-enhancement') return 'enhance';
  return 'resume';
}

export function ChatPanel<T = unknown>({
  mode,
  context,
  isOpen,
  onOpenChange,
  onOutput,
  className,
  title = 'AI Assistant',
  placeholder = 'Ask something about your document...',
}: ChatPanelProps<T>) {
  const { state, sendMessage, updateContext, reset, abort, isGenerating } =
    useConversation<T>({
      mode,
      initialContext: context,
      persistenceKey: `chat-panel:${mode}`,
      onComplete: onOutput,
    });

  // Sync context when prop changes
  const prevContextRef = useRef(context);
  useEffect(() => {
    if (prevContextRef.current !== context) {
      updateContext(context);
      prevContextRef.current = context;
    }
  }, [context, updateContext]);

  // Auto-scroll to bottom on new messages
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.messages, state.isStreaming]);

  const handleSend = useCallback(
    async ({
      message,
      attachments,
      modelId,
    }: {
      message: string;
      attachments?: ConversationAttachment[];
      modelId?: string;
    }) => {
      await sendMessage({ message, attachments, modelId, stream: true });
    },
    [sendMessage]
  );

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // When panel is closed, show only the floating trigger button
  if (!isOpen) {
    return <ChatTrigger onClick={() => onOpenChange(true)} />;
  }

  return (
    <div
      className={cn(
        'fixed right-0 top-0 z-40 flex h-full w-[560px] max-w-[96vw] flex-col',
        'border-l border-border bg-background shadow-2xl',
        'animate-in slide-in-from-right duration-300',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={reset}
            disabled={isGenerating}
            aria-label="Reset conversation"
            className="text-xs text-muted-foreground"
          >
            New
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleClose}
            aria-label="Close panel"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {state.error && (
        <div className="flex items-start gap-2 border-b border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span className="flex-1">{state.error}</span>
          <button
            onClick={abort}
            className="text-xs underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="flex flex-col gap-4 p-4">
          {state.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
              <p className="text-sm">No messages yet.</p>
              <p className="text-xs">
                Start a conversation to get AI-powered suggestions.
              </p>
            </div>
          )}

          {state.messages.map((message, index) => {
            const isLastAssistant =
              message.role === 'assistant' &&
              index === state.messages.length - 1;
            return (
              <ChatMessage
                key={message.id}
                message={message}
                isStreaming={isLastAssistant && state.isStreaming}
              />
            );
          })}

          {/* Generating indicator for non-streaming */}
          {isGenerating && !state.isStreaming && (
            <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Generating...
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isGenerating}
        placeholder={placeholder}
        feature={getFeatureFromMode(mode)}
        requireModelSelection
      />
    </div>
  );
}
