'use client';

import { useAITask } from './useAITask';
import { useCallback } from 'react';
import { Resume } from '@/lib/validations/jsonresume';

interface ResumeEnhancementOutput {
  resume?: Resume;
}

export function useResumeEnhancement() {
  const { runTask, isLoading, error, output, reset } = useAITask({
    mode: 'resume-enhancement',
  });

  const enhance = useCallback(async (resume: Resume, instructions: string) => {
    return runTask({
      message: instructions,
      context: { resume }
    });
  }, [runTask]);

  const typedOutput = output as ResumeEnhancementOutput | null;

  return {
    enhance,
    enhancedResume: typedOutput?.resume ?? null,
    isLoading,
    error,
    reset,
  };
}
