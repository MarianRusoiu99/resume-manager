'use client';

import { useAITask } from './useAITask';
import { Resume } from '@/lib/validations/jsonresume';
import { useCallback } from 'react';

/**
 * useResumeGeneration - Specialized hook for resume generation using the unified AITask orchestrator.
 */
export function useResumeGeneration() {
  const { runTask, isLoading, error, output, partialOutput } = useAITask({
    mode: 'resume-generation' as any,
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

  // Logic for parsing score and suggestions from output if they are included in the response format
  const matchScore = (output as any)?.matchScore ?? null;
  const suggestions = (output as any)?.suggestions ?? [];
  const resume = (output as any)?.resume ?? (partialOutput ? null : null); // In real app, partialOutput might be streamed JSON

  return {
    generate,
    resume: (output as any)?.resume as Resume | null,
    matchScore,
    suggestions,
    isLoading,
    error,
    partialOutput
  };
}
