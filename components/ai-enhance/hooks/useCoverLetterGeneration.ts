'use client';

import { useAITask } from './useAITask';
import { useCallback } from 'react';

/**
 * useCoverLetterGeneration - Specialized hook for cover letter generation using the unified AITask orchestrator.
 */
export function useCoverLetterGeneration() {
  const { runTask, isLoading, error, output, partialOutput, reset } = useAITask({
    mode: 'cover-letter' as any,
  });

  const generate = useCallback(async ({
    jobDescription,
    profileId,
    personalInstructions,
    overrideModelId
  }: {
    jobDescription: string;
    profileId: string;
    personalInstructions?: string;
    overrideModelId?: string;
  }) => {
    return runTask({
      message: `Job Description: ${jobDescription}\n\nAdditional Instructions: ${personalInstructions || 'None'}`,
      modelId: overrideModelId,
      context: { profileId, jobDescription, personalInstructions }
    });
  }, [runTask]);

  return {
    generate,
    coverLetter: (output as any)?.content || partialOutput,
    isLoading,
    error,
    reset,
  };
}
