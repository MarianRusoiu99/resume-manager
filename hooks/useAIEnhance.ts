/**
 * useAIEnhance Hook
 * 
 * React hook for managing AI text enhancement state and API calls.
 * Composes useAIModels for model fetching and selection.
 * 
 * Features:
 * - Content and instructions state management
 * - Model selection via useAIModels
 * - Debounced enhancement to prevent API spam
 * - Error handling with typed errors
 */

import { useState, useCallback, useRef } from 'react';
import { useAIModels, type AIModel } from './useAIModels';
import type { ContentType } from '@/lib/validations/settings';
import { apiV1 } from '@/lib/client';

interface UseAIEnhanceOptions {
  /** Content type for enhancement */
  contentType?: ContentType;
  /** Additional context for the AI */
  context?: string;
  /** Debounce delay in ms (default: 500) */
  debounceMs?: number;
}

interface UseAIEnhanceReturn {
  // Content state
  originalContent: string;
  enhancedContent: string;
  instructions: string;
  
  // Loading/error state
  isLoading: boolean;
  error: string | null;
  
  // Model selection (from useAIModels)
  selectedModel: string;
  models: AIModel[];
  modelsLoading: boolean;
  
  // Actions
  setOriginalContent: (content: string) => void;
  setInstructions: (instructions: string) => void;
  setSelectedModel: (modelId: string) => void;
  enhance: () => Promise<void>;
  reset: () => void;
  fetchModels: () => Promise<void>;
  
  // Derived state
  canEnhance: boolean;
  hasEnhancement: boolean;
}

/**
 * Hook for AI text enhancement with model selection
 * 
 * @example
 * ```tsx
 * const {
 *   originalContent,
 *   setOriginalContent,
 *   instructions,
 *   setInstructions,
 *   enhance,
 *   enhancedContent,
 *   isLoading,
 *   error
 * } = useAIEnhance({ contentType: 'text' });
 * ```
 */
export function useAIEnhance(options: UseAIEnhanceOptions = {}): UseAIEnhanceReturn {
  const { contentType = 'text', context, debounceMs = 500 } = options;

  // Content state
  const [originalContent, setOriginalContent] = useState('');
  const [enhancedContent, setEnhancedContent] = useState('');
  const [instructions, setInstructions] = useState('');
  
  // Loading/error state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debounce tracking
  const lastEnhanceTime = useRef<number>(0);

  // Model selection from composed hook
  const {
    models,
    isLoading: modelsLoading,
    selectedModel,
    setSelectedModel,
    fetchModels,
  } = useAIModels();

  /**
   * Enhance content with AI
   * Includes debouncing to prevent API spam
   */
  const enhance = useCallback(async () => {
    // Validate inputs
    if (!originalContent.trim()) {
      setError('Please provide content to enhance');
      return;
    }

    if (!instructions.trim()) {
      setError('Please provide instructions for the AI');
      return;
    }

    // Debounce check
    const now = Date.now();
    if (now - lastEnhanceTime.current < debounceMs) {
      return;
    }
    lastEnhanceTime.current = now;

    try {
      setIsLoading(true);
      setError(null);

      const result = await apiV1.AI.ENHANCE.post<{ enhancedContent?: string }>({
        content: originalContent,
        instructions,
        context,
        contentType,
        modelId: selectedModel || undefined,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setEnhancedContent(result.data?.enhancedContent ?? '');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Enhancement failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [originalContent, instructions, selectedModel, contentType, context, debounceMs]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setOriginalContent('');
    setEnhancedContent('');
    setInstructions('');
    setError(null);
  }, []);

  return {
    // Content state
    originalContent,
    enhancedContent,
    instructions,
    
    // Loading/error state
    isLoading,
    error,
    
    // Model selection
    selectedModel,
    models,
    modelsLoading,
    
    // Actions
    setOriginalContent,
    setInstructions,
    setSelectedModel,
    enhance,
    reset,
    fetchModels,
    
    // Derived state
    canEnhance: Boolean(originalContent.trim() && instructions.trim() && !isLoading),
    hasEnhancement: enhancedContent.length > 0,
  };
}
