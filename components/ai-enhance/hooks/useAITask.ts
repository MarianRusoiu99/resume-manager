'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useConversation, ConversationMode, ConversationAttachment } from './useConversation';
import { createComponentLogger } from '@/lib/utils/client-logger';

const logger = createComponentLogger('useAITask');

export interface AITaskOptions<T = unknown> {
  mode: ConversationMode;
  onSuccess?: (output: T) => void;
  onError?: (error: string) => void;
  stream?: boolean;
}

export interface RunTaskOptions {
  message: string;
  attachments?: ConversationAttachment[];
  modelId?: string;
  context?: unknown;
  stream?: boolean;
}

/**
 * useAITask - Unified hook for all AI-related generation and enhancement tasks.
 * Wraps useConversation and provides a consistent interface for the UI.
 */
export function useAITask<T = unknown>(options: AITaskOptions<T>) {
  const { mode, onSuccess, onError, stream: defaultStream = true } = options;
  const [partialOutput, setPartialOutput] = useState<string>('');

  const { sendMessage, state, reset, abort } = useConversation<T>({
    mode,
    onStreamUpdate: (content: string) => {
      setPartialOutput(content);
    },
    onComplete: (output: T) => {
      onSuccess?.(output);
    },
    onError: (err: string) => {
      toast.error(err);
      onError?.(err);
    },
  });

  const runTask = useCallback(
    async ({ message, attachments, modelId, context, stream }: RunTaskOptions): Promise<T | null> => {
      setPartialOutput('');
      
      try {
        return await sendMessage({
          message,
          attachments,
          modelId,
          stream: stream ?? defaultStream,
          // Pass context directly to avoid race condition with setState
          contextOverride: context as Record<string, unknown> | undefined,
        });
      } catch (err) {
        logger.error(`AI Task Error (${mode})`, err);
        return null;
      }
    },
    [sendMessage, mode, defaultStream]
  );


  return {
    runTask,
    reset,
    abort,
    partialOutput,
    isLoading: state.isLoading,
    error: state.error,
    output: state.output,
    messages: state.messages,
    hasOutput: !!state.output || !!partialOutput,
  };
}
