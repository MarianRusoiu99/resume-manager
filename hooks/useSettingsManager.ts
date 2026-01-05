'use client';

import { useState, useCallback, useEffect } from 'react';
import { ExternalServiceError } from "@/lib/errors";
import { type AISettings, type ApiProvider } from '@/lib/actions/types';
import { createComponentLogger } from '@/lib/utils/client-logger';
import { getApiProviders } from '@/app/actions/api-provider';
import { getAISettings } from '@/app/actions/ai-settings';

const logger = createComponentLogger('useSettingsManager');

interface UseSettingsManagerOptions {
  autoFetch?: boolean;
}

export function useSettingsManager({ autoFetch = true }: UseSettingsManagerOptions = {}) {
  // Providers state
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [providersError, setProvidersError] = useState<string | null>(null);

  // AI Settings state
  const [aiSettings, setAISettings] = useState<AISettings | null>(null);
  const [isLoadingAISettings, setIsLoadingAISettings] = useState(false);
  const [aiSettingsError, setAISettingsError] = useState<string | null>(null);

  /**
   * Fetch API providers
   */
  const refreshProviders = useCallback(async () => {
    try {
      setIsLoadingProviders(true);
      setProvidersError(null);

      const result = await getApiProviders();

      if (!result.success) {
        throw new ExternalServiceError('Settings API', result.error);
      }

      setProviders((result.data as unknown as ApiProvider[]) ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch providers';
      setProvidersError(message);
      logger.error('Failed to fetch API providers', err);
    } finally {
      setIsLoadingProviders(false);
    }
  }, []);

  /**
   * Fetch AI settings
   */
  const refreshAISettings = useCallback(async () => {
    try {
      setIsLoadingAISettings(true);
      setAISettingsError(null);

      const result = await getAISettings();

      if (!result.success) {
        throw new ExternalServiceError('Settings API', result.error);
      }

      setAISettings(result.data as unknown as AISettings);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch AI settings';
      setAISettingsError(message);
      logger.error('Failed to fetch AI settings', err);
    } finally {
      setIsLoadingAISettings(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      refreshProviders();
      refreshAISettings();
    }
  }, [autoFetch, refreshProviders, refreshAISettings]);

  return {
    providers,
    isLoadingProviders,
    providersError,
    hasProviders: providers.length > 0,
    refreshProviders,
    aiSettings,
    isLoadingAISettings,
    aiSettingsError,
    refreshAISettings,
    isLoading: isLoadingProviders || isLoadingAISettings,
  };
}
