'use client';

/**
 * useTemplateGeneration Hook
 * 
 * Specialized hook for extracting templates from images using AI.
 * Uses the unified conversational AI system with 'template-generation' mode.
 */

import { useCallback, useState } from 'react';
import { useConversation } from './useConversation';
import type { ExtractedTemplate } from '@/lib/ai/template-parser';
import { toast } from 'sonner';

export interface UseTemplateGenerationReturn {
  generate: (imageFile: File) => Promise<void>;
  template: ExtractedTemplate | null;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useTemplateGeneration(): UseTemplateGenerationReturn {
  const [template, setTemplate] = useState<ExtractedTemplate | null>(null);

  const { sendMessage, state, reset: resetConversation } = useConversation({
    mode: 'template-generation',
    onComplete: (output) => {
      if (output && typeof output === 'object') {
        setTemplate(output as ExtractedTemplate);
      }
    },
    onError: (error) => {
      toast.error(`Template generation failed: ${error}`);
    },
  });

  const generate = useCallback(async (imageFile: File) => {
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(imageFile);
      const base64 = await base64Promise;

      await sendMessage({
        message: 'Please extract the template from this image. Return the result in the specified JSON format including the Handlebars HTML template and CSS styles.',
        attachments: [
          {
            type: 'image',
            name: imageFile.name,
            content: base64,
            mimeType: imageFile.type,
          },
        ],
      });
    } catch (error) {
      console.error('Failed to start template generation:', error);
      toast.error('Failed to process image');
    }
  }, [sendMessage]);

  const reset = useCallback(() => {
    resetConversation();
    setTemplate(null);
  }, [resetConversation]);

  return {
    generate,
    template,
    isLoading: state.isLoading,
    error: state.error,
    reset,
  };
}
