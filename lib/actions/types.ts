/**
 * Shared types for Server Actions (application boundary).
 * 
 * @deprecated Use domain-specific types in '@/lib/types/' instead.
 * This file re-exports from canonical sources for backward compatibility.
 */

// Re-export everything from canonical domain types
export * from '@/lib/types';

// Re-export service-layer types used by UI components
export type {
  AIFeatureConfig,
  FeatureModelSelection as ServiceFeatureModelSelection,
  ResolvedAISettings,
  UpdateFeaturePreferenceInput,
} from '@/lib/services/ai-settings/types';

/**
 * Simplified model info for UI components.
 * @deprecated Import ApiModel from '@/lib/types/api-provider' instead.
 */
export type ModelInfo = {
  id: string;
  name: string;
  description?: string;
};
