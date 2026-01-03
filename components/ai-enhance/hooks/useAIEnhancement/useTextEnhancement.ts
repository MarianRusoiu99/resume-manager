'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useConversation } from '../useConversation';
import type { UseAIEnhancementReturn, TextEnhancementOptions } from './types';

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
