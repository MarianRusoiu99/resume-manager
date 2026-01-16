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
    isStreaming: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Helper function to parse streaming response
   */
  const handleStreamResponse = async <T>(
    response: Response, 
    updateState: (delta: Partial<T>) => void,
    onComplete: (final: T) => void,
    onError: (error: string) => void
  ): Promise<T | null> => {
    if (!response.body) {
      throw new Error('Response body is missing');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    // Using a ref to accumulate the partial object if needed, 
    // but in this case we're relying on the delta.partial structure
    // from the backend which sends deep partials we can just set
    let finalOutput: T | null = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n').filter(Boolean);
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'delta') {
              updateState(data.partial);
            } else if (data.type === 'complete') {
              finalOutput = data.final;
              onComplete(data.final);
            } else if (data.type === 'error') {
              onError(data.error);
              throw new Error(data.error);
            }
          }
        }
      }
      
      return finalOutput;
    } finally {
      reader.releaseLock();
    }
  };

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
      isStreaming: false,
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
      isStreaming: false,
    }));
  }, []);

  /**
   * Send a message
   */
  const sendMessage = useCallback(
    async ({ message, attachments, modelId, contextOverride, stream = false }: SendMessageOptions): Promise<T | null> => {
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
        isStreaming: stream,
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
            stream,
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

        // Handle streaming response
        if (stream && response.headers.get('Content-Type')?.includes('text/event-stream')) {
          // Streaming implementation
          const conversationId = response.headers.get('X-Conversation-Id');
          
          if (conversationId) {
             setState(prev => ({ ...prev, id: conversationId }));
          }

          // Initial empty assistant message placeholder
          const assistantMessageId = generateId();
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, {
              id: assistantMessageId,
              role: 'assistant',
              content: '',
              timestamp: new Date(),
            }]
          }));

          const result = await handleStreamResponse<T>(
            response,
            (partial) => {
              setState(prev => ({
                ...prev,
                output: { ...prev.output, ...partial } as T, // Merge partial output
              }));
            },
            (final) => {
              // Complete handler
              setState(prev => {
                // Update the assistant message with final content
                const updatedMessages = prev.messages.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, output: final, content: JSON.stringify(final, null, 2) } 
                    : msg
                );
                
                return {
                  ...prev,
                  messages: updatedMessages,
                  output: final,
                  isLoading: false,
                  isStreaming: false
                };
              });
              onComplete?.(final);
            },
            (error) => {
               throw new Error(error);
            }
          );
          
          return result;
        }

        // Handle non-streaming response
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
          isStreaming: false,
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
          isStreaming: false,
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
