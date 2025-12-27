import type { AIFeatureType, ModelPreference } from '@/lib/repositories/interfaces';
import type { ProviderWithModels } from '../api-provider';

/**
 * Feature configuration with display info.
 */
export interface AIFeatureConfig {
  id: AIFeatureType;
  name: string;
  description: string;
  icon?: string;
}

/**
 * Complete model selection for a feature.
 */
export interface FeatureModelSelection {
  feature: AIFeatureConfig;
  providerId: string | null;
  providerName: string | null;
  modelId: string | null;
  modelName: string | null;
}

/**
 * All settings with resolved names.
 */
export interface ResolvedAISettings {
  features: FeatureModelSelection[];
  availableProviders: ProviderWithModels[];
}

/**
 * Input for updating a feature's model preference.
 */
export interface UpdateFeaturePreferenceInput {
  userId: string;
  feature: AIFeatureType;
  providerId: string | null;
  modelId: string | null;
}

export type { AIFeatureType, ModelPreference };
