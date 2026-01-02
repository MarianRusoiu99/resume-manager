'use client';

/**
 * useCoverLetterGeneration Hook
 * 
 * Specialized hook for generating cover letters using AI.
 * Uses the unified conversational AI system with 'cover-letter-generation' mode.
 */

import { useCallback, useState } from 'react';
import { useConversation } from './useConversation';
import { toast } from 'sonner';

export interface CoverLetterGenerationOptions {
  jobDescription: string;
  jobTitle?: string;
  company?: string;
  personalInstructions?: string;
  overrideModelId?: string;
}

export interface UseCoverLetterGenerationReturn {
  generate: (options: CoverLetterGenerationOptions) => Promise<void>;
  coverLetter: string | null;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useCoverLetterGeneration(): UseCoverLetterGenerationReturn {
  const [coverLetter, setCoverLetter] = useState<string | null>(null);

  const { sendMessage, state, reset: resetConversation, updateContext } = useConversation({
    mode: 'cover-letter-generation',
    onComplete: (output: any) => {
      if (output && typeof output === 'object' && output.content) {
        setCoverLetter(output.content);
      } else if (typeof output === 'string') {
        setCoverLetter(output);
      } else if (state.messages.length > 0) {
        // Fallback to the last assistant message content if no structured output
        const lastAssistantMessage = [...state.messages]
          .reverse()
          .find((m) => m.role === 'assistant');
        if (lastAssistantMessage) {
          setCoverLetter(lastAssistantMessage.content);
        }
      }
    },
    onError: (error) => {
      toast.error(`Cover letter generation failed: ${error}`);
    },
  });

  const generate = useCallback(async (options: CoverLetterGenerationOptions) => {
    // Set context first
    updateContext({
      job: {
        description: options.jobDescription,
        title: options.jobTitle,
        company: options.company,
      },
      personalInstructions: options.personalInstructions,
    });

    try {
      await sendMessage({
        message: 'Please generate a professional cover letter tailored to this job description and my profile.',
        modelId: options.overrideModelId,
      });
    } catch (error) {
      console.error('Failed to start cover letter generation:', error);
    }
  }, [sendMessage, updateContext]);

  const reset = useCallback(() => {
    resetConversation();
    setCoverLetter(null);
  }, [resetConversation]);

  return {
    generate,
    coverLetter,
    isLoading: state.isLoading,
    error: state.error,
    reset,
  };
}
