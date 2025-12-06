/**
 * useAIEnhance Hook
 * React hook for managing AI text enhancement state
 */

import { useState, useCallback } from 'react';

interface AIModel {
    id: string;
    name: string;
    provider: string;
}

interface UseAIEnhanceOptions {
    contentType?: 'text' | 'html' | 'css' | 'markdown';
    context?: string;
}

interface UseAIEnhanceReturn {
    originalContent: string;
    enhancedContent: string;
    instructions: string;
    isLoading: boolean;
    error: string | null;
    selectedModel: string;
    models: AIModel[];
    modelsLoading: boolean;
    setOriginalContent: (content: string) => void;
    setInstructions: (instructions: string) => void;
    setSelectedModel: (modelId: string) => void;
    enhance: () => Promise<void>;
    reset: () => void;
    fetchModels: () => Promise<void>;
}

export function useAIEnhance(options: UseAIEnhanceOptions = {}): UseAIEnhanceReturn {
    const { contentType = 'text', context } = options;

    const [originalContent, setOriginalContent] = useState('');
    const [enhancedContent, setEnhancedContent] = useState('');
    const [instructions, setInstructions] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState('');
    const [models, setModels] = useState<AIModel[]>([]);
    const [modelsLoading, setModelsLoading] = useState(false);

    const fetchModels = useCallback(async () => {
        try {
            setModelsLoading(true);
            const response = await fetch('/api/settings/api-providers/models');
            if (response.ok) {
                const data = await response.json();
                // API returns { allModels: [...], byProvider: {...} }
                const allModels = (data.allModels || []).map((m: { id: string; name: string; providerId: string }) => ({
                    id: m.id,
                    name: m.name,
                    provider: m.providerId,
                }));
                setModels(allModels);
                if (allModels.length > 0 && !selectedModel) {
                    setSelectedModel(allModels[0].id);
                }
            }
        } catch (err) {
            console.error('Failed to fetch models:', err);
        } finally {
            setModelsLoading(false);
        }
    }, [selectedModel]);

    const enhance = useCallback(async () => {
        if (!originalContent.trim()) {
            setError('Please provide content to enhance');
            return;
        }

        if (!instructions.trim()) {
            setError('Please provide instructions for the AI');
            return;
        }

        if (!selectedModel) {
            setError('Please select an AI model');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/ai/enhance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: originalContent,
                    instructions,
                    context,
                    contentType,
                    modelId: selectedModel,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Enhancement failed');
            }

            const data = await response.json();
            setEnhancedContent(data.enhancedContent);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Enhancement failed');
        } finally {
            setIsLoading(false);
        }
    }, [originalContent, instructions, selectedModel, contentType, context]);

    const reset = useCallback(() => {
        setOriginalContent('');
        setEnhancedContent('');
        setInstructions('');
        setError(null);
    }, []);

    return {
        originalContent,
        enhancedContent,
        instructions,
        isLoading,
        error,
        selectedModel,
        models,
        modelsLoading,
        setOriginalContent,
        setInstructions,
        setSelectedModel,
        enhance,
        reset,
        fetchModels,
    };
}
