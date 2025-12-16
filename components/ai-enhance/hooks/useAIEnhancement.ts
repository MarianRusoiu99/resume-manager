'use client';

/**
 * Centralized AI Enhancement Hook
 * 
 * Provides shared enhancement logic for all AI enhancement modals.
 * Handles API calls, state management, and error handling.
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { ContentType } from '@/lib/validations/settings';
import { apiV1 } from '@/lib/client';

/**
 * Options for text enhancement
 */
export interface TextEnhancementOptions {
  content: string;
  instructions: string;
  context?: string;
  contentType?: ContentType;
  modelId?: string;
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
  enhance: (attachmentsContext?: string) => Promise<void>;
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

  const enhance = useCallback(async (attachmentsContext?: string) => {
    if (!instructions.trim()) {
      toast.error('Please provide instructions for the AI');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const fullContext = [options.context, attachmentsContext]
        .filter(Boolean)
        .join('\n\n');

      const result = await apiV1.AI.ENHANCE.post<{ enhancedContent?: string }>({
        content: options.content,
        instructions,
        context: fullContext || undefined,
        contentType: options.contentType,
        modelId: options.modelId,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setEnhancedContent(result.data?.enhancedContent ?? '');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Enhancement failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [instructions, options]);

  const reset = useCallback(() => {
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

  const enhance = useCallback(async (attachmentsContext?: string) => {
    if (!instructions.trim()) {
      toast.error('Please provide instructions for the AI');
      return;
    }

    if (!resume) {
      toast.error('No resume data provided');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const resumeJson = JSON.stringify(resume, null, 2);
      const contextParts = [
        'This is a JSON Resume format document',
        attachmentsContext,
      ].filter(Boolean);

      const result = await apiV1.AI.ENHANCE.post<{ enhancedContent?: string }>({
        content: `RESUME DATA (JSON format - you MUST return valid JSON in this exact structure):
${resumeJson}`,
        instructions: `${instructions}

CRITICAL INSTRUCTIONS:
1. You MUST return ONLY valid JSON in the exact same structure as the input
2. Modify the content based on the instructions above
3. Preserve ALL required fields (name, email, etc.)
4. Improve text quality: better wording, stronger impact, professional tone
5. Keep dates, company names, and factual information unchanged unless asked
6. Return ONLY the JSON object, no explanations or markdown`,
        context: contextParts.join('\n\n'),
        contentType: 'text',
      });

      if (result.error) {
        throw new Error(result.error);
      }

      const enhancedJson = result.data?.enhancedContent ?? '';
      const parsedResume = parseResumeJson<T>(enhancedJson);
      setEnhancedContent(parsedResume);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Enhancement failed';
      if (message.includes('JSON')) {
        setError('AI returned invalid JSON. Please try again.');
        toast.error('AI returned invalid JSON. Please try again.');
      } else {
        setError(message);
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [instructions, resume]);

  const reset = useCallback(() => {
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

  const setTemplate = useCallback((html: string, css: string) => {
    setTemplateData({ html, css });
  }, []);

  const enhance = useCallback(async (attachmentsContext?: string) => {
    if (!instructions.trim()) {
      toast.error('Please provide instructions for the AI');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const combinedContent = `=== HTML TEMPLATE ===
${templateData.html}

=== CSS STYLES ===
${templateData.css}`;

      const contextParts = [
        'This is a resume template with Handlebars syntax ({{variable}}, {{#each}}, etc.)',
        attachmentsContext,
      ].filter(Boolean);

      const result = await apiV1.AI.ENHANCE.post<{ enhancedContent?: string }>({
        content: combinedContent,
        instructions: `${instructions}

IMPORTANT: You must return both the HTML and CSS in this exact format:
=== HTML TEMPLATE ===
[enhanced HTML here]

=== CSS STYLES ===
[enhanced CSS here]

Make sure to preserve both sections and the exact separator format.`,
        context: contextParts.join('\n\n'),
        contentType: 'html',
      });

      if (result.error) {
        throw new Error(result.error);
      }

      const parsed = parseTemplateResponse(result.data?.enhancedContent ?? '', templateData.css);
      setEnhancedContent(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Enhancement failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [instructions, templateData]);

  const reset = useCallback(() => {
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
