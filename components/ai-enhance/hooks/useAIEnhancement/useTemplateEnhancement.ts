'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useConversation } from '../useConversation';
import type { UseAIEnhancementReturn } from './types';
import { parseTemplateResponse } from './utils';

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
