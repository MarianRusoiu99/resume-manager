'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiFetch } from '@/lib/utils/api-client';
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
import type { DeepPartial } from '@/lib/types';

// Re-export types for barrel consumers
export type {
  ConversationMode,
  ConversationAttachment,
  ConversationMessage,
  ConversationContext,
  ConversationData,
  ConversationUIState,
  ConversationState,
  SendMessageOptions,
  UseConversationOptions,
  UseConversationReturn,
} from './types';

const EMPTY_CONTEXT: ConversationContext = {};

// Helper type for deep merging partials
function mergeDeep<T>(target: T, source: DeepPartial<T>): T {
  if (typeof source !== 'object' || source === null) {
    return source as unknown as T;
  }
  
  if (Array.isArray(source)) {
    // For arrays, we just replace for now or could implement append logic
    // But typically in streaming we get replaced arrays or we need smarter diffing
    // For simplicity, we'll replace if it's an array
    return source as unknown as T;
  }
  
  const result = { ...target } as Record<string, unknown>;
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (source[key] instanceof Object && key in result) {
        result[key] = mergeDeep(result[key], source[key] as Record<string, unknown>);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result as T;
}

/**
 * Hook for managing AI conversations
 */
export function useConversation<T = unknown>(options: UseConversationOptions<T>): UseConversationReturn<T> {
  const { mode, initialContext = EMPTY_CONTEXT, persistenceKey, onComplete, onError } = options;

  const createEmptyState = useCallback((): ConversationState<T> => ({
    id: null,
    mode,
    messages: [],
    context: initialContext,
    output: null,
    savedId: null,
    isLoading: false,
    isStreaming: false,
    error: null,
  }), [mode, initialContext]);

  const [state, setState] = useState<ConversationState<T>>(createEmptyState);

  const abortControllerRef = useRef<AbortController | null>(null);

  const persistenceEnabled = Boolean(persistenceKey);
  const [hasHydratedPersistence, setHasHydratedPersistence] = useState(!persistenceEnabled);

  useEffect(() => {
    if (!persistenceEnabled || !persistenceKey) return;

    setState(createEmptyState());
    setHasHydratedPersistence(false);

    try {
      const raw = window.localStorage.getItem(persistenceKey);
      if (!raw) {
        setHasHydratedPersistence(true);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<ConversationState<T>>;
      const persistedMessages = Array.isArray(parsed?.messages) ? parsed.messages : null;
      if (!parsed || parsed.mode !== mode || !persistedMessages) {
        setHasHydratedPersistence(true);
        return;
      }

      setState((prev) => ({
        ...prev,
        id: parsed.id ?? prev.id,
        mode,
        messages: persistedMessages.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp as unknown as string) : new Date(),
        })),
        context: parsed.context ?? prev.context,
        output: parsed.output ?? prev.output,
        savedId: parsed.savedId ?? prev.savedId,
        isLoading: false,
        isStreaming: false,
        error: null,
      }));
      setHasHydratedPersistence(true);
    } catch {
      // ignore invalid persisted state
      setHasHydratedPersistence(true);
    }
  }, [mode, persistenceEnabled, persistenceKey, createEmptyState]);

  useEffect(() => {
    if (!persistenceEnabled || !persistenceKey || !hasHydratedPersistence) return;

    try {
      const persistable: Partial<ConversationState<T>> = {
        id: state.id,
        mode: state.mode,
        messages: state.messages,
        context: state.context,
        output: state.output,
        savedId: state.savedId,
      };
      window.localStorage.setItem(persistenceKey, JSON.stringify(persistable));
    } catch {
      // ignore storage write errors (quota/private mode)
    }
  }, [persistenceEnabled, persistenceKey, hasHydratedPersistence, state.id, state.mode, state.messages, state.context, state.output, state.savedId]);

  /**
   * Helper function to parse streaming response
   */
  const handleStreamResponse = async <T>(
    response: Response, 
    updateState: (delta: DeepPartial<T>) => void,
    onComplete: (final: T, savedId?: string | null) => void,
    onError: (error: string) => void,
    assistantMessageId: string
  ): Promise<T | null> => {
    if (!response.body) {
      throw new Error('Response body is missing');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let finalOutput: T | null = null;
    let savedId: string | null = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n').filter(Boolean);
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'delta') {
                updateState(data.partial);
              } else if (data.type === 'text') {
                // Accumulate streaming text on the assistant message content
                setState(prev => ({
                  ...prev,
                  messages: prev.messages.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: (msg.content || '') + data.text }
                      : msg
                  ),
                }));
              } else if (data.type === 'reasoning') {
                // Accumulate reasoning/thinking text on the assistant message
                setState(prev => ({
                  ...prev,
                  messages: prev.messages.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, thinking: (msg.thinking || '') + data.text }
                      : msg
                  ),
                }));
              } else if (data.type === 'complete') {
                finalOutput = data.final;
              } else if (data.type === 'saved') {
                savedId = data.id;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (e) {
               // If it was the error we threw, rethrow it
               if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                 onError(e.message);
                 throw e;
               }
               // Otherwise ignore JSON parse errors for partial chunks
            }
          }
        }
      }
      
      if (finalOutput) {
        onComplete(finalOutput, savedId);
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
    setState(createEmptyState());
  }, [createEmptyState]);

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
        const response = await apiFetch('/api/v1/ai/chat', {
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
              setState(prev => {
                // Merge partial output with current output
                // If current output is null, start with partial
                // Note: deeply merging partials is tricky but necessary for nested objects
                const currentOutput = prev.output || {} as T;
                const newOutput = mergeDeep(currentOutput, partial);
                
                return {
                  ...prev,
                  output: newOutput,
                };
              });
            },
            (final, savedId) => {
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
                  savedId: savedId || null,
                  isLoading: false,
                  isStreaming: false
                };
              });
              onComplete?.(final, savedId);
            },
            (error) => {
               throw new Error(error);
            },
            assistantMessageId
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
          savedId: result.data.savedId || null,
          isLoading: false,
          isStreaming: false,
        }));

        onComplete?.(result.data.output as T, result.data.savedId);
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
