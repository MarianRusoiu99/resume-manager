'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useConversation, ConversationMode, ConversationAttachment } from './useConversation';

export interface AITaskOptions {
  mode: ConversationMode;
  onSuccess?: (output: any) => void;
  onError?: (error: string) => void;
  stream?: boolean;
}

export interface RunTaskOptions {
  message: string;
  attachments?: ConversationAttachment[];
  modelId?: string;
  context?: any;
}

/**
 * useAITask - Unified hook for all AI-related generation and enhancement tasks.
 * Wraps useConversation and provides a consistent interface for the UI.
 */
export function useAITask(options: AITaskOptions) {
  const { mode, onSuccess, onError, stream = true } = options;
  const [partialOutput, setPartialOutput] = useState<string>('');

  const { sendMessage, state, reset, abort, updateContext } = useConversation({
    mode,
    onStreamUpdate: (content: string) => {
      setPartialOutput(content);
    },
    onComplete: (output: any) => {
      onSuccess?.(output);
    },
    onError: (err: string) => {
      toast.error(err);
      onError?.(err);
    },
  });

  const runTask = useCallback(
    async ({ message, attachments, modelId, context }: RunTaskOptions) => {
      setPartialOutput('');
      
      if (context) {
        updateContext(context);
      }

      try {
        await sendMessage({
          message,
          attachments,
          modelId,
          stream,
        });
      } catch (err) {
        console.error(`AI Task Error (${mode}):`, err);
      }
    },
    [sendMessage, mode, updateContext, stream]
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
