'use client';

/**
 * useResumeGeneration Hook
 * 
 * Specialized hook for generating resumes using AI.
 * Uses the unified conversational AI system with 'resume-generation' mode.
 */

import { useCallback, useState } from 'react';
import { useConversation, type ConversationContext } from './useConversation';
import { toast } from 'sonner';

export interface ResumeGenerationOptions {
  jobDescription?: string;
  jobTitle?: string;
  company?: string;
  personalInstructions?: string;
  overrideModelId?: string;
}

export interface UseResumeGenerationReturn {
  generate: (options: ResumeGenerationOptions) => Promise<void>;
  resume: any | null;
  matchScore: number | null;
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useResumeGeneration(): UseResumeGenerationReturn {
  const [resume, setResume] = useState<any | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const { sendMessage, state, reset: resetConversation, updateContext } = useConversation({
    mode: 'resume-generation',
    onComplete: (output: any) => {
      if (output && typeof output === 'object') {
        setResume(output.resume || output);
        setMatchScore(output.matchScore || null);
        setSuggestions(output.suggestions || []);
      }
    },
    onError: (error) => {
      toast.error(`Resume generation failed: ${error}`);
    },
  });

  const generate = useCallback(async (options: ResumeGenerationOptions) => {
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
        message: 'Please generate a tailored resume based on my profile and the provided job description. Optimize for ATS and highlight relevant skills.',
        modelId: options.overrideModelId,
      });
    } catch (error) {
      console.error('Failed to start resume generation:', error);
    }
  }, [sendMessage, updateContext]);

  const reset = useCallback(() => {
    resetConversation();
    setResume(null);
    setMatchScore(null);
    setSuggestions([]);
  }, [resetConversation]);

  return {
    generate,
    resume,
    matchScore,
    suggestions,
    isLoading: state.isLoading,
    error: state.error,
    reset,
  };
}
