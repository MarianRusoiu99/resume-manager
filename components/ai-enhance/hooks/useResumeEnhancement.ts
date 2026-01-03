'use client';

import { useAITask } from './useAITask';
import { useCallback } from 'react';
import { Resume } from '@/lib/validations/jsonresume';

export function useResumeEnhancement() {
  const { runTask, isLoading, error, output, partialOutput, reset } = useAITask({
    mode: 'resume-enhancement' as any,
  });

  const enhance = useCallback(async (resume: Resume, instructions: string) => {
    return runTask({
      message: instructions,
      context: { resume }
    });
  }, [runTask]);

  return {
    enhance,
    enhancedResume: (output as any)?.resume || (partialOutput ? null : null),
    isLoading,
    error,
    reset,
  };
}
