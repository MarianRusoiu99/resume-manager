import type { AIFeatureType, ModelPreference } from '@/lib/repositories/interfaces';
import type { ResolvedProviderData } from '../api-providers';
import type {
  FeatureModelSelection as CanonicalFeatureModelSelection,
  ProviderWithModels,
} from '@/lib/types/ai-settings';

/**
 * Feature configuration with display info (service-layer extends canonical).
 */
export interface AIFeatureConfig {
  id: AIFeatureType;
  name: string;
  description: string;
  icon?: string;
}

/**
 * Complete model selection for a feature (service-layer version with AIFeatureConfig).
 */
export interface FeatureModelSelection {
  feature: AIFeatureConfig;
  providerId: string | null;
  providerName: string | null;
  modelId: string | null;
  modelName: string | null;
}

/**
 * All settings with resolved names (service-layer version with full provider data).
 */
export interface ResolvedAISettings {
  features: FeatureModelSelection[];
  availableProviders: ResolvedProviderData[];
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

export type { AIFeatureType, ModelPreference, ProviderWithModels };
