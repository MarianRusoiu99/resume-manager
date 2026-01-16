import { ProviderType } from '@prisma/client';

/**
 * AI Settings Domain Types
 *
 * Type definitions related to AI provider and model preferences.
 */

/**
 * AI feature types
 */
export type AIFeature = 'resume' | 'coverLetter' | 'enhance' | 'template';

/**
 * Model selection for a feature
 */
export interface FeatureModelSelection {
  feature: AIFeature;
  id: string;
  name: string;
  description: string;
  providerId: string | null;
  providerName: string | null;
  modelId: string | null;
  modelName: string | null;
}

/**
 * User's AI settings data
 */
export interface UserAISettingsData {
  features: FeatureModelSelection[];
  availableProviders: {
    id: string;
    name: string;
    provider: ProviderType;
    isActive: boolean;
    models: {
      id: string;
      modelKey: string;
      displayName: string | null;
      description: string | null;
      isActive: boolean;
    }[];
  }[];
}
