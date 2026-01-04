'use client';

import { useAITask } from './useAITask';
import { useCallback } from 'react';
import type { TextEnhancementOutput } from '@/lib/ai/modes/types';

export function useTextEnhancement() {
  const { runTask, isLoading, error, output, reset } = useAITask<TextEnhancementOutput>({
    mode: 'text-enhancement',
  });

  const enhance = useCallback(async (text: string, instructions: string) => {
    return runTask({
      message: instructions,
      context: { text }
    });
  }, [runTask]);

  return {
    enhance,
    enhancedText: output?.content || '',
    isLoading,
    error,
    reset,
  };
}
