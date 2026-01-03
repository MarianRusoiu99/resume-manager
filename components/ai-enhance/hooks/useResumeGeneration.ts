'use client';

import { useAITask } from './useAITask';
import { Resume } from '@/lib/validations/jsonresume';
import { useCallback } from 'react';

interface ResumeGenerationOutput {
  resume?: Resume;
  matchScore?: number;
  suggestions?: string[];
}

/**
 * useResumeGeneration - Specialized hook for resume generation using the unified AITask orchestrator.
 */
export function useResumeGeneration() {
  const { runTask, isLoading, error, output, partialOutput } = useAITask({
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

  const typedOutput = output as ResumeGenerationOutput | null;

  return {
    generate,
    resume: typedOutput?.resume ?? null,
    matchScore: typedOutput?.matchScore ?? null,
    suggestions: typedOutput?.suggestions ?? [],
    isLoading,
    error,
    partialOutput
  };
}
