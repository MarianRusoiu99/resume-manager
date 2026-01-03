'use client';

import { useState, useCallback, useRef } from 'react';
import { 
  type UseConversationOptions, 
  type UseConversationReturn, 
  type ConversationState, 
  type ConversationContext, 
  type SendMessageOptions, 
  type ConversationMessage 
} from './types';
import { generateId, processStreamResponse } from './utils';

/**
 * Hook for managing AI conversations
 */
export function useConversation(options: UseConversationOptions): UseConversationReturn {
  const { mode, initialContext = {}, onStreamUpdate, onComplete, onError } = options;

  const [state, setState] = useState<ConversationState>({
    id: null,
    mode,
    messages: [],
    context: initialContext,
    output: null,
    isLoading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Update context
   */
  const updateContext = useCallback((context: Partial<ConversationContext>) => {
    setState((prev) => ({
      ...prev,
      context: {
        ...prev.context,
        ...context,
      },
    }));
  }, []);

  /**
   * Reset conversation
   */
  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setState({
      id: null,
      mode,
      messages: [],
      context: initialContext,
      output: null,
      isLoading: false,
      error: null,
    });
  }, [mode, initialContext]);

  /**
   * Abort current generation
   */
  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setState((prev) => ({
      ...prev,
      isLoading: false,
    }));
  }, []);

  /**
   * Send a message
   */
  const sendMessage = useCallback(
    async ({ message, attachments, modelId, stream = true }: SendMessageOptions) => {
      // Abort any existing request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      // Add user message to state
      const userMessage: ConversationMessage = {
        id: generateId(),
        role: 'user',
        content: message,
        timestamp: new Date(),
        attachments,
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true,
        error: null,
      }));

      try {
        const response = await fetch('/api/v1/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: state.id,
            mode: state.mode,
            message,
            attachments,
            context: state.context,
            modelId,
            stream,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Request failed: ${response.status}`);
        }

        // Get conversation ID from header
        const conversationId = response.headers.get('X-Conversation-Id');
        if (conversationId && !state.id) {
          setState((prev) => ({ ...prev, id: conversationId }));
        }

        if (stream && response.body) {
          // Handle streaming response
          const { fullContent, output } = await processStreamResponse(response.body, (content) => {
             onStreamUpdate?.(content);
          });

          const assistantMessage: ConversationMessage = {
            id: generateId(),
            role: 'assistant',
            content: fullContent,
            timestamp: new Date(),
            output,
          };

          setState((prev) => ({
            ...prev,
            id: conversationId || prev.id,
            messages: [...prev.messages, assistantMessage],
            output,
            isLoading: false,
          }));

          onComplete?.(output);
        } else {
          // Handle non-streaming response
          const result = await response.json();
          
          if (!result.success || !result.data) {
            throw new Error(result.error || 'Request failed');
          }

          const assistantMessage: ConversationMessage = {
            id: generateId(),
            role: 'assistant',
            content: result.data.text,
            timestamp: new Date(),
            output: result.data.output,
          };

          setState((prev) => ({
            ...prev,
            id: result.data.conversationId,
            messages: [...prev.messages, assistantMessage],
            output: result.data.output,
            isLoading: false,
          }));

          onComplete?.(result.data.output);
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return; // Ignore abort errors
        }

        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        onError?.(errorMessage);
      }
    },
    [state.id, state.mode, state.context, onError, onComplete, onStreamUpdate]
  );

  return {
    state,
    sendMessage,
    updateContext,
    reset,
    abort,
    isGenerating: state.isLoading,
  };
}
