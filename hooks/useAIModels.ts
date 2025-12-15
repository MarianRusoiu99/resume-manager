/**
 * useAIModels Hook
 * 
 * Fetches and manages available AI models from user's configured providers.
 * Separated from enhancement logic for better reusability.
 */

import { useState, useCallback, useEffect } from 'react';
import { API_V1 } from '@/lib/constants';
import { apiJson } from '@/lib/utils/api-client';
import { createComponentLogger } from '@/lib/utils/client-logger';

const logger = createComponentLogger('useAIModels');

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  providerId: string;
}

interface UseAIModelsOptions {
  /** Automatically fetch models on mount */
  autoFetch?: boolean;
}

interface UseAIModelsReturn {
  models: AIModel[];
  isLoading: boolean;
  error: string | null;
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
  fetchModels: () => Promise<void>;
  hasModels: boolean;
}

/**
 * Hook for fetching and selecting AI models
 * 
 * @example
 * ```tsx
 * const { models, selectedModel, setSelectedModel, isLoading } = useAIModels({ autoFetch: true });
 * 
 * return (
 *   <Select value={selectedModel} onValueChange={setSelectedModel}>
 *     {models.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
 *   </Select>
 * );
 * ```
 */
export function useAIModels(options: UseAIModelsOptions = {}): UseAIModelsReturn {
  const { autoFetch = false } = options;

  const [models, setModels] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('');

  const fetchModels = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await apiJson<{ allModels?: unknown[] }>(API_V1.SETTINGS.MODELS);

      if (result.error) {
        throw new Error(result.error);
      }

      const data = result.data;

      // API returns { allModels: [...], byProvider: {...} }
      const rawModels = data?.allModels ?? [];

      const allModels = (Array.isArray(rawModels) ? rawModels : []).map((model) => {
        const m = model as {
          id: string;
          name: string;
          providerId: string;
          providerType?: string;
        };

        return {
          id: m.id,
          name: m.name,
          provider: m.providerType || 'unknown',
          providerId: m.providerId,
        };
      });

      setModels(allModels);
      
      // Auto-select first model if none selected
      if (allModels.length > 0 && !selectedModel) {
        setSelectedModel(allModels[0].id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch models';
      setError(message);
      logger.error('Failed to fetch AI models', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedModel]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchModels();
    }
  }, [autoFetch, fetchModels]);

  return {
    models,
    isLoading,
    error,
    selectedModel,
    setSelectedModel,
    fetchModels,
    hasModels: models.length > 0,
  };
}
