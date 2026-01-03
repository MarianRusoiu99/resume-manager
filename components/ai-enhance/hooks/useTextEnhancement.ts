'use client';

import { useAITask } from './useAITask';
import { useCallback } from 'react';

export function useTextEnhancement() {
  const { runTask, isLoading, error, output, partialOutput, reset } = useAITask({
    mode: 'text-enhancement' as any,
  });

  const enhance = useCallback(async (text: string, instructions: string) => {
    return runTask({
      message: instructions,
      context: { text }
    });
  }, [runTask]);

  return {
    enhance,
    enhancedText: (output as any)?.text || partialOutput,
    isLoading,
    error,
    reset,
  };
}
