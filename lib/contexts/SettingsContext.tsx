'use client';

/**
 * Settings Context
 * 
 * Provides global access to user's settings including API providers
 * and AI model preferences. Avoids prop drilling and provides
 * consistent settings access across the application.
 * 
 * @example
 * ```tsx
 * // In a layout
 * <SettingsProvider>
 *   {children}
 * </SettingsProvider>
 * 
 * // In a component
 * const { providers, hasProviders, refreshProviders } = useSettings();
 * ```
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { API } from '@/lib/constants/routes';
import { createComponentLogger } from '@/lib/utils/client-logger';

const logger = createComponentLogger('SettingsContext');

// ============================================================================
// Types
// ============================================================================

interface ApiProvider {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  keyPreview: string;
  models: string[];
  createdAt: string;
  lastUsedAt: string | null;
}

interface AISettings {
  resumeProviderId: string | null;
  resumeModelId: string | null;
  coverLetterProviderId: string | null;
  coverLetterModelId: string | null;
  enhanceProviderId: string | null;
  enhanceModelId: string | null;
  templateProviderId: string | null;
  templateModelId: string | null;
}

interface SettingsContextValue {
  // API Providers
  providers: ApiProvider[];
  isLoadingProviders: boolean;
  providersError: string | null;
  hasProviders: boolean;
  refreshProviders: () => Promise<void>;
  
  // AI Settings
  aiSettings: AISettings | null;
  isLoadingAISettings: boolean;
  aiSettingsError: string | null;
  refreshAISettings: () => Promise<void>;
  
  // Combined loading state
  isLoading: boolean;
}

// ============================================================================
// Context
// ============================================================================

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface SettingsProviderProps {
  children: ReactNode;
  /** Automatically fetch settings on mount (default: true) */
  autoFetch?: boolean;
}

export function SettingsProvider({
  children,
  autoFetch = true,
}: SettingsProviderProps) {
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

      const response = await fetch(API.SETTINGS.API_PROVIDERS);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch providers');
      }

      const data = await response.json();
      setProviders(data);
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

      const response = await fetch(API.SETTINGS.AI_MODELS);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch AI settings');
      }

      const data = await response.json();
      setAISettings(data);
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

  // Memoized context value
  const value = useMemo<SettingsContextValue>(
    () => ({
      // Providers
      providers,
      isLoadingProviders,
      providersError,
      hasProviders: providers.length > 0,
      refreshProviders,
      
      // AI Settings
      aiSettings,
      isLoadingAISettings,
      aiSettingsError,
      refreshAISettings,
      
      // Combined loading
      isLoading: isLoadingProviders || isLoadingAISettings,
    }),
    [
      providers,
      isLoadingProviders,
      providersError,
      refreshProviders,
      aiSettings,
      isLoadingAISettings,
      aiSettingsError,
      refreshAISettings,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access settings context
 * Must be used within a SettingsProvider
 */
export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  
  return context;
}

/**
 * Hook to check if AI features are available (has at least one provider configured)
 */
export function useCanUseAI(): boolean {
  const { hasProviders } = useSettings();
  return hasProviders;
}
