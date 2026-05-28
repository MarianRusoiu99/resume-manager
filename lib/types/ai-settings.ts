import { ProviderType } from '@prisma/client';
import type { ApiModel } from './api-provider';

/**
 * AI Settings Domain Types
 *
 * Type definitions related to AI provider and model preferences.
 */

/**
 * Complete AI settings (application boundary).
 */
export interface AISettings {
  features: FeatureModelSelection[];
  availableProviders: ProviderWithModels[];
}

/**
 * AI feature types (canonical source of truth)
 */
export const AI_FEATURES = ['resume', 'coverLetter', 'enhance', 'template'] as const;
export type AIFeature = (typeof AI_FEATURES)[number];

/**
 * Model selection for a feature
 */
export interface FeatureModelSelection {
  feature: {
    id: string;
    name: string;
    description: string;
  };
  providerId: string | null;
  providerName: string | null;
  modelId: string | null;
  modelName: string | null;
}

/**
 * Simplified provider info for UI settings.
 */
export type ProviderWithModels = {
  id: string;
  name: string;
  provider: string;
  models: ApiModel[];
  isActive: boolean;
};

/**
 * User's AI settings data (internal).
 */
export interface UserAISettingsData {
  features: FeatureModelSelection[];
  availableProviders: {
    id: string;
    name: string;
    provider: ProviderType;
    isActive: boolean;
    models: ApiModel[];
  }[];
}
