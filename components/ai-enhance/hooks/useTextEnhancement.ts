'use client';

import { useAITask } from './useAITask';
import { useCallback } from 'react';

interface TextEnhancementOutput {
  text?: string;
}

export function useTextEnhancement() {
  const { runTask, isLoading, error, output, partialOutput, reset } = useAITask({
    mode: 'text-enhancement',
  });

  const enhance = useCallback(async (text: string, instructions: string) => {
    return runTask({
      message: instructions,
      context: { text }
    });
  }, [runTask]);

  const typedOutput = output as TextEnhancementOutput | null;

  return {
    enhance,
    enhancedText: typedOutput?.text || partialOutput,
    isLoading,
    error,
    reset,
  };
}
