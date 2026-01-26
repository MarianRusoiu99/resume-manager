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
  useMemo,
  type ReactNode,
} from 'react';
import { type AISettings, type ApiProvider } from '@/lib/actions/types';
import { useSettingsManager } from "@/hooks";
import { ConfigurationError } from "@/lib/errors";

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
  const settingsManager = useSettingsManager({ autoFetch });

  // Memoized context value
  const value = useMemo<SettingsContextValue>(
    () => ({
      ...settingsManager,
    }),
    [settingsManager]
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
    throw new ConfigurationError('useSettings must be used within a SettingsProvider');
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
