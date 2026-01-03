'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useConversation } from '../useConversation';
import type { UseAIEnhancementReturn } from './types';

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
