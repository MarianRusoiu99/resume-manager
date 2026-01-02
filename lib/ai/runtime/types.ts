import type { AIProvider } from '@/lib/ai/providers';
import type { AIFeatureType } from '@/lib/services/ai-settings';

export type AIModelFeature = AIFeatureType;

export type ResolvedAIModel = {
  provider: AIProvider;
  providerId: string;
  providerType: string;
  /** Database model id (ApiModel.id) */
  modelId: string;
  /** Provider-native model identifier (ApiModel.modelKey) */
  modelKey: string;
  /** Feature used for resolution */
  feature: AIModelFeature;
};

export type ResolveAIModelInput = {
  userId: string;
  feature: AIModelFeature;
  /** Optional override model (ApiModel.id or ApiModel.modelKey) */
  modelId?: string;
};
