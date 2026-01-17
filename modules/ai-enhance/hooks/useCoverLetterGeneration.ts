'use client';

import { useAITask } from './useAITask';
import { useCallback } from 'react';
import type { Resume } from '@/lib/validations/jsonresume';

interface CoverLetterOutput {
  content?: string;
  jobTitle?: string;
  companyName?: string;
}

/**
 * useCoverLetterGeneration - Specialized hook for cover letter generation using the unified AITask orchestrator.
 */
export function useCoverLetterGeneration() {
  const { runTask, isLoading, error, output, reset, savedId } = useAITask({
    mode: 'cover-letter-generation',
  });

  const generate = useCallback(async ({
    jobDescription,
    profileId,
    personalInstructions,
    overrideModelId,
    profileResume
  }: {
    jobDescription: string;
    profileId?: string;
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

  const typedOutput = output as CoverLetterOutput | null;

  return {
    generate,
    coverLetter: typedOutput?.content || '',
    jobTitle: typedOutput?.jobTitle || '',
    companyName: typedOutput?.companyName || '',
    isLoading,
    error,
    reset,
    savedId,
  };
}
