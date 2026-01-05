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
}

export interface RunTaskOptions {
  message: string;
  attachments?: ConversationAttachment[];
  modelId?: string;
  context?: unknown;
}

/**
 * useAITask - Unified hook for all AI-related generation and enhancement tasks.
 * Wraps useConversation and provides a consistent interface for the UI.
 */
export function useAITask<T = unknown>(options: AITaskOptions<T>) {
  const { mode, onSuccess, onError } = options;
  const [partialOutput] = useState<string>('');

  const { sendMessage, state, reset, abort } = useConversation<T>({
    mode,
    onComplete: (output: T) => {
      onSuccess?.(output);
    },
    onError: (err: string) => {
      toast.error(err);
      onError?.(err);
    },
  });

  const runTask = useCallback(
    async ({ message, attachments, modelId, context }: RunTaskOptions): Promise<T | null> => {
      try {
        return await sendMessage({
          message,
          attachments,
          modelId,
          // Pass context directly to avoid race condition with setState
          contextOverride: context as Record<string, unknown> | undefined,
        });
      } catch (err) {
        logger.error(`AI Task Error (${mode})`, err);
        return null;
      }
    },
    [sendMessage, mode]
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
