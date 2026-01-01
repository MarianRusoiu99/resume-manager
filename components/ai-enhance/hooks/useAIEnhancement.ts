'use client';

/**
 * Centralized AI Enhancement Hooks
 *
 * Provides shared enhancement logic for all AI enhancement modals.
 * Uses the unified /api/v1/ai/chat endpoint for all AI interactions.
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { ContentType } from '@/lib/validations/settings';

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
 * Options for template enhancement (HTML + CSS)
 */
export interface TemplateEnhancementOptions {
  html: string;
  css: string;
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
  enhance: (attachments?: any[]) => Promise<void>;
  reset: () => void;
  hasEnhancement: boolean;
}

/**
 * Parse enhanced resume JSON from AI response
 */
function parseResumeJson<T>(content: string): T {
  let cleaned = content.trim();

  // Remove markdown code blocks if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  return JSON.parse(cleaned) as T;
}

/**
 * Parse template enhancement response (HTML + CSS)
 */
function parseTemplateResponse(content: string, originalCss: string): { html: string; css: string } {
  const htmlRegex = /=== HTML TEMPLATE ===\s*([\s\S]*?)(?:=== CSS STYLES ===|$)/;
  const cssRegex = /=== CSS STYLES ===\s*([\s\S]*?)$/;

  const htmlMatch = htmlRegex.exec(content);
  const cssMatch = cssRegex.exec(content);

  return {
    html: htmlMatch ? htmlMatch[1].trim() : content,
    css: cssMatch ? cssMatch[1].trim() : originalCss,
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
          // Ignore parse errors for malformed chunks
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState('');
  const [options, setOptions] = useState<Omit<TextEnhancementOptions, 'instructions'>>({
    content: '',
    contentType: 'text',
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const enhance = useCallback(
    async (attachments?: any[]) => {
      const hasAttachments = attachments && attachments.length > 0;
      if (!instructions.trim() && !hasAttachments) {
        toast.error('Please provide instructions or attach a file');
        return;
      }

      // Abort any previous request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      try {
        setIsLoading(true);
        setError(null);
        setEnhancedContent(''); // Start with empty string for streaming

        // Build the message including the content to enhance
        const message = `${instructions}

--- CONTENT TO ENHANCE ---
${options.content}`;

        await streamChatRequest('text-enhancement', message, {
          context: options.context
            ? { personalInstructions: options.context }
            : undefined,
          modelId: options.modelId,
          attachments: attachments?.map((a) => ({
            type: a.type.startsWith('image/') ? 'image' : 'document',
            content: a.content,
            name: a.name,
          })),
          signal: abortControllerRef.current.signal,
          onChunk: (content) => {
            setEnhancedContent(content);
          },
        });
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return;
        }
        const message = err instanceof Error ? err.message : 'Enhancement failed';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [instructions, options]
  );

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setEnhancedContent(null);
    setError(null);
    setInstructions('');
  }, []);

  return {
    enhancedContent,
    isLoading,
    error,
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState('');
  const [resume, setResume] = useState<T | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const enhance = useCallback(
    async (attachments?: any[]) => {
      const hasAttachments = attachments && attachments.length > 0;
      if (!instructions.trim() && !hasAttachments) {
        toast.error('Please provide instructions or attach a file');
        return;
      }

      if (!resume) {
        toast.error('No resume data provided');
        return;
      }

      // Abort any previous request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      try {
        setIsLoading(true);
        setError(null);

        // Build the message
        const message = `${instructions}

Please enhance the resume according to the instructions above and return the updated JSON Resume format.`;

        const result = await streamChatRequest('resume-enhancement', message, {
          context: {
            currentResume: resume as Record<string, unknown>,
          },
          attachments: attachments?.map((a) => ({
            type: a.type.startsWith('image/') ? 'image' : 'document',
            content: a.content,
            name: a.name,
          })),
          signal: abortControllerRef.current.signal,
        });

        // Parse the final result
        try {
          const parsed = parseResumeJson<T>(result);
          setEnhancedContent(parsed);
        } catch (e) {
          console.error('Failed to parse enhanced resume JSON:', e);
          setError('Failed to parse the AI response as valid resume data. Please try again.');
          toast.error('Failed to parse the AI response');
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return;
        }
        const message = err instanceof Error ? err.message : 'Enhancement failed';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [instructions, resume]
  );

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setEnhancedContent(null);
    setError(null);
    setInstructions('');
  }, []);

  return {
    enhancedContent,
    isLoading,
    error,
    enhance,
    reset,
    hasEnhancement: enhancedContent !== null,
    setResume,
    setInstructions,
    instructions,
  };
}

/**
 * Centralized hook for template enhancement (HTML + CSS)
 */
export function useTemplateEnhancement(): UseAIEnhancementReturn<{ html: string; css: string }> & {
  setTemplate: (html: string, css: string) => void;
  setInstructions: (instructions: string) => void;
  instructions: string;
} {
  const [enhancedContent, setEnhancedContent] = useState<{ html: string; css: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState('');
  const [templateData, setTemplateData] = useState<{ html: string; css: string }>({ html: '', css: '' });
  const abortControllerRef = useRef<AbortController | null>(null);

  const setTemplate = useCallback((html: string, css: string) => {
    setTemplateData({ html, css });
  }, []);

  const enhance = useCallback(
    async (attachments?: any[]) => {
      const hasAttachments = attachments && attachments.length > 0;
      if (!instructions.trim() && !hasAttachments) {
        toast.error('Please provide instructions or attach a file');
        return;
      }

      // Abort any previous request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      try {
        setIsLoading(true);
        setError(null);

        // Build the message
        const message = `${instructions}

IMPORTANT: You must return both the HTML and CSS in this exact format:
=== HTML TEMPLATE ===
[enhanced HTML here]

=== CSS STYLES ===
[enhanced CSS here]

Make sure to preserve both sections and the exact separator format.`;

        const result = await streamChatRequest('template-enhancement', message, {
          context: {
            template: {
              htmlTemplate: templateData.html,
              cssStyles: templateData.css,
            },
          },
          attachments: attachments?.map((a) => ({
            type: a.type.startsWith('image/') ? 'image' : 'document',
            content: a.content,
            name: a.name,
          })),
          signal: abortControllerRef.current.signal,
        });

        const parsed = parseTemplateResponse(result, templateData.css);
        setEnhancedContent(parsed);
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return;
        }
        const message = err instanceof Error ? err.message : 'Enhancement failed';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [instructions, templateData]
  );

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setEnhancedContent(null);
    setError(null);
    setInstructions('');
  }, []);

  return {
    enhancedContent,
    isLoading,
    error,
    enhance,
    reset,
    hasEnhancement: enhancedContent !== null,
    setTemplate,
    setInstructions,
    instructions,
  };
}
