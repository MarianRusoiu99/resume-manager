'use client';

import { useAITask } from './useAITask';
import { useCallback } from 'react';
import type { ResumeGenerationOutput } from '@/lib/ai/modes/types';

/**
 * useResumeGeneration - Specialized hook for resume generation using the unified AITask orchestrator.
 */
export function useResumeGeneration() {
  const { runTask, isLoading, error, output, partialOutput } = useAITask<ResumeGenerationOutput>({
    mode: 'resume-generation',
  });

  const generate = useCallback(async ({
    jobDescription,
    personalInstructions,
    overrideModelId
  }: {
    jobDescription: string;
    personalInstructions?: string;
    overrideModelId?: string;
  }) => {
    return runTask({
      message: `Job Description: ${jobDescription}\n\nAdditional Instructions: ${personalInstructions || 'None'}`,
      modelId: overrideModelId,
      context: { jobDescription }
    });
  }, [runTask]);

  return {
    generate,
    resume: output?.resume ?? null,
    matchScore: output?.matchScore ?? null,
    suggestions: output?.suggestions ?? [],
    isLoading,
    error,
    partialOutput
  };
}
