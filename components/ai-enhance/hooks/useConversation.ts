'use client';

/**
 * useConversation Hook
 *
 * Manages AI conversation state on the client side.
 * Works with the /api/v1/ai/chat endpoint.
 */

import { useState, useCallback, useRef } from 'react';

/**
 * Conversation mode
 */
export type ConversationMode =
  | 'resume-generation'
  | 'resume-enhancement'
  | 'cover-letter-generation'
  | 'template-generation'
  | 'template-enhancement'
  | 'text-enhancement';

/**
 * Attachment for sending to the API
 */
export interface ConversationAttachment {
  type: 'document' | 'image' | 'resume' | 'job-description' | 'template';
  name: string;
  content: string;
  mimeType: string;
}

/**
 * Message in the conversation
 */
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: ConversationAttachment[];
  /** Structured output from assistant (if available) */
  output?: unknown;
}

/**
 * Context for resume/cover letter generation
 */
export interface ConversationContext {
  userProfile?: {
    resume?: Record<string, unknown>;
    name?: string;
  };
  job?: {
    description?: string;
    title?: string;
    company?: string;
  };
  template?: {
    htmlTemplate?: string;
    name?: string;
  };
  currentResume?: Record<string, unknown>;
  currentCoverLetter?: string;
  personalInstructions?: string;
}

/**
 * Conversation state
 */
export interface ConversationState {
  id: string | null;
  mode: ConversationMode;
  messages: ConversationMessage[];
  context: ConversationContext;
  output: unknown | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Options for sending a message
 */
export interface SendMessageOptions {
  message: string;
  attachments?: ConversationAttachment[];
  /** Override model for this message */
  modelId?: string;
  /** Use streaming (default: true) */
  stream?: boolean;
}

/**
 * Hook options
 */
export interface UseConversationOptions {
  mode: ConversationMode;
  initialContext?: ConversationContext;
  /** Called when streaming output updates */
  onStreamUpdate?: (content: string) => void;
  /** Called when generation completes */
  onComplete?: (output: unknown) => void;
  /** Called on error */
  onError?: (error: string) => void;
}

/**
 * Hook return type
 */
export interface UseConversationReturn {
  /** Current conversation state */
  state: ConversationState;
  /** Send a message to the AI */
  sendMessage: (options: SendMessageOptions) => Promise<void>;
  /** Update context */
  updateContext: (context: Partial<ConversationContext>) => void;
  /** Clear conversation and start fresh */
  reset: () => void;
  /** Abort current generation */
  abort: () => void;
  /** Whether currently generating */
  isGenerating: boolean;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

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
   * Handle streaming response
   */
  const handleStreamResponse = useCallback(async (body: ReadableStream<Uint8Array>, conversationId: string | null) => {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let output: unknown = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'text-delta' && parsed.content) {
              fullContent += parsed.content;
              onStreamUpdate?.(fullContent);
            } else if (parsed.type === 'finish') {
              // Streaming complete
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error);
            }
          } catch (parseError) {
            // Ignore parse errors for malformed chunks
          }
        }
      }

      // Try to parse structured output from content
      try {
        if (fullContent.includes('{')) {
          const jsonMatch = fullContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, fullContent];
          output = JSON.parse(jsonMatch[1] || fullContent);
        }
      } catch {
        // Not JSON, that's okay
      }

      // Add assistant message
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
    } catch (error) {
      throw error;
    } finally {
      reader.releaseLock();
    }
  }, [onComplete, onStreamUpdate]);

  /**
   * Handle non-streaming response
   */
  const handleNonStreamResponse = useCallback((result: {
    success: boolean;
    data?: {
      conversationId: string;
      output: unknown;
      text: string;
    };
    error?: string;
  }) => {
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
      id: result.data!.conversationId,
      messages: [...prev.messages, assistantMessage],
      output: result.data!.output,
      isLoading: false,
    }));

    onComplete?.(result.data.output);
  }, [onComplete]);

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
          await handleStreamResponse(response.body, conversationId || state.id);
        } else {
          // Handle non-streaming response
          const result = await response.json();
          handleNonStreamResponse(result);
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
    [state.id, state.mode, state.context, onError, handleStreamResponse, handleNonStreamResponse]
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
