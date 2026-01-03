'use client';

import { useAITask } from './useAITask';
import { useCallback } from 'react';

interface CoverLetterOutput {
  content?: string;
}

/**
 * useCoverLetterGeneration - Specialized hook for cover letter generation using the unified AITask orchestrator.
 */
export function useCoverLetterGeneration() {
  const { runTask, isLoading, error, output, partialOutput, reset } = useAITask({
    mode: 'cover-letter-generation',
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

  const typedOutput = output as CoverLetterOutput | null;

  return {
    generate,
    coverLetter: typedOutput?.content || partialOutput,
    isLoading,
    error,
    reset,
  };
}
