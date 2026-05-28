'use client';

import { useAITask } from './useAITask';
import { useCallback } from 'react';
import type { ResumeGenerationOutput } from '@/lib/ai/modes/types';
import type { Resume } from '@/lib/validations/jsonresume';

/**
 * useResumeGeneration - Specialized hook for resume generation using the unified AITask orchestrator.
 */
export function useResumeGeneration() {
  const { runTask, isLoading, error, output, savedId, reset } = useAITask<ResumeGenerationOutput>({
    mode: 'resume-generation',
  });

  const generate = useCallback(async ({
    jobDescription,
    personalInstructions,
    overrideModelId,
    profileResume
  }: {
    jobDescription: string;
    personalInstructions?: string;
    overrideModelId?: string;
    profileResume?: Resume | null;
  }) => {
    return runTask({
      message: `Job Description: ${jobDescription}\n\nAdditional Instructions: ${personalInstructions || 'None'}`,
      modelId: overrideModelId,
      context: { 
        job: { description: jobDescription },
        userProfile: profileResume ? { resume: profileResume } : undefined,
        personalInstructions 
      }
    });
  }, [runTask]);

  return {
    generate,
    resume: output?.resume ?? null,
    isLoading,
    error,
    savedId,
    reset,
  };
}
