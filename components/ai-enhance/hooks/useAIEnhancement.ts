'use client';

/**
 * Centralized AI Enhancement Hooks
 *
 * Provides shared enhancement logic for all AI enhancement modals.
 * Uses the unified /api/v1/ai/chat endpoint for all AI interactions.
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { ContentType } from '@/lib/validations/settings';
import { useConversation } from './useConversation';

/**
 * Conversation mode type (matches API)
 */
type ConversationMode =
  | 'resume-generation'
  | 'resume-enhancement'
  | 'cover-letter-generation'
  | 'template-generation'
  | 'template-enhancement'
  | 'text-enhancement';

/**
 * Options for text enhancement
 */
export interface TextEnhancementOptions {
  content: string;
  instructions: string;
  context?: string;
  contentType?: ContentType;
  modelId?: string;
  attachments?: Array<{
    type: string;
    content: string;
    name: string;
  }>;
}

/**
 * Options for template enhancement (Unified HTML with embedded styles)
 */
export interface TemplateEnhancementOptions {
  html: string;
  instructions: string;
  context?: string;
}

/**
 * Enhancement result
 */
export interface EnhancementResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Hook return type
 */
export interface UseAIEnhancementReturn<T> {
  enhancedContent: T | null;
  isLoading: boolean;
  error: string | null;
  enhance: (attachments?: any[], overrideModelId?: string) => Promise<void>;
  reset: () => void;
  hasEnhancement: boolean;
}

/**
 * Parse enhanced resume JSON from AI response
 */
function parseResumeJson<T>(content: string): T {
  let cleaned = content.trim();

  // Try to find JSON within the content if it's not a pure JSON string
  // This handles cases where the AI might include preamble or postamble text
  const startBracket = cleaned.indexOf('{');
  const endBracket = cleaned.lastIndexOf('}');

  if (startBracket !== -1 && endBracket !== -1 && endBracket > startBracket) {
    cleaned = cleaned.substring(startBracket, endBracket + 1);
  } else if (cleaned.startsWith('```')) {
    // Fallback to markdown code block removal if brackets not found or malformed
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  try {
    const parsed = JSON.parse(cleaned);

    // If the response follows the structured output schema { resume: ..., changes: ... }
    if (parsed && typeof parsed === 'object' && 'resume' in parsed) {
      return parsed.resume as T;
    }

    return parsed as T;
  } catch (e) {
    console.error('Parse error content:', cleaned);
    throw e;
  }
}

/**
 * Parse template enhancement response (HTML)
 */
function parseTemplateResponse(content: string): { html: string } {
  return {
    html: content.trim(),
  };
}

/**
 * Base streaming function for chat API
 */
async function streamChatRequest(
  mode: ConversationMode,
  message: string,
  options: {
    context?: Record<string, unknown>;
    modelId?: string;
    attachments?: Array<{ type: string; content: string; name: string; mimeType?: string }>;
    signal?: AbortSignal;
    onChunk?: (content: string) => void;
  }
): Promise<string> {
  const response = await fetch('/api/v1/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode,
      message,
      context: options.context,
      modelId: options.modelId,
      attachments: options.attachments?.map((a) => ({
        type: a.type as 'document' | 'image' | 'resume' | 'job-description' | 'template',
        name: a.name,
        content: a.content,
        mimeType: a.mimeType || 'text/plain',
      })),
      stream: true,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Enhancement failed');
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';

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
            accumulated += parsed.content;
            options.onChunk?.(accumulated);
          } else if (parsed.type === 'error') {
            throw new Error(parsed.error);
          }
        } catch (parseError) {
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return accumulated;
}

/**
 * Centralized hook for text/content enhancement
 */
export function useTextEnhancement(): UseAIEnhancementReturn<string> & {
  setOptions: (options: Omit<TextEnhancementOptions, 'instructions'>) => void;
  setInstructions: (instructions: string) => void;
  instructions: string;
} {
  const [enhancedContent, setEnhancedContent] = useState<string | null>(null);
  const [instructions, setInstructions] = useState('');
  const [options, setOptions] = useState<Omit<TextEnhancementOptions, 'instructions'>>({
    content: '',
    contentType: 'text',
  });

  const { sendMessage, state, reset: resetConversation, updateContext } = useConversation({
    mode: 'text-enhancement',
    onStreamUpdate: (content) => {
      setEnhancedContent(content);
    },
    onError: (err) => {
      toast.error(err);
    },
  });

  const enhance = useCallback(
    async (attachments?: any[], overrideModelId?: string) => {
      const hasAttachments = attachments && attachments.length > 0;
      if (!instructions.trim() && !hasAttachments) {
        toast.error('Please provide instructions or attach a file');
        return;
      }

      updateContext({
        personalInstructions: options.context,
      });

      try {
        const message = `${instructions}

--- CONTENT TO ENHANCE ---
${options.content}`;

        await sendMessage({
          message,
          modelId: overrideModelId || options.modelId,
          attachments: attachments?.map((a) => ({
            type: a.type.startsWith('image/') ? 'image' : 'document',
            content: a.content,
            name: a.name,
            mimeType: a.mimeType || (a.type.startsWith('image/') ? a.type : 'text/plain'),
          })),
        });
      } catch (err) {
        console.error('Enhancement error:', err);
      }
    },
    [instructions, options, sendMessage, updateContext]
  );

  const reset = useCallback(() => {
    resetConversation();
    setEnhancedContent(null);
    setInstructions('');
  }, [resetConversation]);

  return {
    enhancedContent,
    isLoading: state.isLoading,
    error: state.error,
    enhance,
    reset,
    hasEnhancement: enhancedContent !== null,
    setOptions,
    setInstructions,
    instructions,
  };
}

/**
 * Centralized hook for resume enhancement
 */
export function useResumeEnhancement<T>(): UseAIEnhancementReturn<T> & {
  setResume: (resume: T) => void;
  setInstructions: (instructions: string) => void;
  instructions: string;
} {
  const [enhancedContent, setEnhancedContent] = useState<T | null>(null);
  const [instructions, setInstructions] = useState('');
  const [resume, setResume] = useState<T | null>(null);

  const { sendMessage, state, reset: resetConversation, updateContext } = useConversation({
    mode: 'resume-enhancement',
    initialContext: resume ? { currentResume: resume as Record<string, unknown> } : {},
    onComplete: (output: unknown) => {
      try {
        if (output) {
          if (typeof output === 'object' && 'resume' in output) {
            setEnhancedContent((output as { resume: T }).resume);
          } else {
            setEnhancedContent(output as T);
          }
        }
      } catch (e) {
        console.error('Failed to process enhanced resume:', e);
        toast.error('Failed to process AI response');
      }
    },
    onError: (err) => {
      toast.error(err);
    },
  });

  const enhance = useCallback(
    async (attachments?: any[], overrideModelId?: string) => {
      const hasAttachments = attachments && attachments.length > 0;
      if (!instructions.trim() && !hasAttachments) {
        toast.error('Please provide instructions or attach a file');
        return;
      }

      if (!resume) {
        toast.error('No resume data provided');
        return;
      }

      updateContext({
        currentResume: resume as Record<string, unknown>,
      });

      try {
        // Build the message
        const message = `${instructions}

Please enhance the resume according to the instructions above and return the updated JSON Resume format.`;

        await sendMessage({
          message,
          modelId: overrideModelId,
          attachments: attachments?.map((a) => ({
            type: a.type.startsWith('image/') ? 'image' : 'document',
            name: a.name,
            content: a.content,
            mimeType: a.mimeType || (a.type.startsWith('image/') ? a.type : 'text/plain'),
          })),
        });
      } catch (err) {
        console.error('Enhancement error:', err);
      }
    },
    [instructions, resume, sendMessage, updateContext]
  );

  const reset = useCallback(() => {
    resetConversation();
    setEnhancedContent(null);
    setInstructions('');
  }, [resetConversation]);

  return {
    enhancedContent,
    isLoading: state.isLoading,
    error: state.error,
    enhance,
    reset,
    hasEnhancement: enhancedContent !== null,
    setResume,
    setInstructions,
    instructions,
  };
}

/**
 * Centralized hook for template enhancement (Unified HTML)
 */
export function useTemplateEnhancement(): UseAIEnhancementReturn<{ html: string }> & {
  setTemplate: (html: string) => void;
  setInstructions: (instructions: string) => void;
  instructions: string;
} {
  const [enhancedContent, setEnhancedContent] = useState<{ html: string } | null>(null);
  const [instructions, setInstructions] = useState('');
  const [templateData, setTemplateData] = useState<{ html: string }>({ html: '' });

  const { sendMessage, state, reset: resetConversation, updateContext } = useConversation({
    mode: 'template-enhancement',
    initialContext: {
      template: {
        htmlTemplate: templateData.html,
      },
    },
    onComplete: (output: unknown) => {
      if (output && typeof output === 'object' && 'html' in output) {
        setEnhancedContent({ html: (output as { html: string }).html });
      } else if (typeof output === 'string') {
        setEnhancedContent(parseTemplateResponse(output));
      }
    },
    onError: (err) => {
      toast.error(err);
    },
  });

  const setTemplate = useCallback((html: string) => {
    setTemplateData({ html });
  }, []);

  const enhance = useCallback(
    async (attachments?: any[], overrideModelId?: string) => {
      const hasAttachments = attachments && attachments.length > 0;
      if (!instructions.trim() && !hasAttachments) {
        toast.error('Please provide instructions or attach a file');
        return;
      }

      updateContext({
        template: {
          htmlTemplate: templateData.html,
        },
      });

      try {
        const message = `${instructions}

IMPORTANT: You must return the complete HTML including internal <style> tags.`;

        await sendMessage({
          message,
          modelId: overrideModelId,
          attachments: attachments?.map((a) => ({
            type: a.type.startsWith('image/') ? 'image' : 'document',
            content: a.content,
            name: a.name,
            mimeType: a.mimeType || (a.type.startsWith('image/') ? a.type : 'text/plain'),
          })),
        });
      } catch (err) {
        console.error('Enhancement error:', err);
      }
    },
    [instructions, templateData, sendMessage, updateContext]
  );

  const reset = useCallback(() => {
    resetConversation();
    setEnhancedContent(null);
    setInstructions('');
  }, [resetConversation]);

  return {
    enhancedContent,
    isLoading: state.isLoading,
    error: state.error,
    enhance,
    reset,
    hasEnhancement: enhancedContent !== null,
    setTemplate,
    setInstructions,
    instructions,
  };
}
