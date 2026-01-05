'use client';

import { useState, useCallback, useRef } from 'react';
import { ExternalServiceError } from "@/lib/errors";
import { 
  type UseConversationOptions, 
  type UseConversationReturn, 
  type ConversationState, 
  type ConversationContext, 
  type SendMessageOptions, 
  type ConversationMessage 
} from './types';
import { generateId } from './utils';

/**
 * Hook for managing AI conversations
 */
export function useConversation<T = unknown>(options: UseConversationOptions<T>): UseConversationReturn<T> {
  const { mode, initialContext = {}, onComplete, onError } = options;

  const [state, setState] = useState<ConversationState<T>>({
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
    async ({ message, attachments, modelId, contextOverride }: SendMessageOptions): Promise<T | null> => {
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

      // Merge context override with existing context
      const mergedContext = contextOverride 
        ? { ...state.context, ...contextOverride }
        : state.context;

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        context: mergedContext,
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
            conversationId: state.id || undefined,
            mode: state.mode,
            message,
            attachments,
            context: mergedContext,
            // Only include modelId if it's a non-empty string
            ...(modelId && { modelId }),
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          // Include validation details if available
          let errorMessage = errorData.error || `Request failed: ${response.status}`;
          if (errorData.details && Array.isArray(errorData.details)) {
            const details = errorData.details
              .map((d: { field?: string; message?: string }) => `${d.field}: ${d.message}`)
              .join(', ');
            errorMessage = `${errorMessage} (${details})`;
          }
          throw new ExternalServiceError('AI Enhancement', errorMessage);
        }

        // Handle non-streaming response only
        const result = await response.json();
        
        if (!result.success || !result.data) {
          throw new ExternalServiceError('AI Enhancement', result.error || 'Request failed');
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
          output: result.data.output as T,
          isLoading: false,
        }));

        onComplete?.(result.data.output as T);
        return result.data.output as T;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return null; // Ignore abort errors
        }

        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        onError?.(errorMessage);
        return null;
      }
    },
    [state.id, state.mode, state.context, onError, onComplete]
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
