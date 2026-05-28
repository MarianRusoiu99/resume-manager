import type { AIProvider } from '@/lib/ai/providers';
import type { AIFeature } from '@/lib/types/ai-settings';

/** @deprecated Use AIFeature from '@/lib/types/ai-settings' instead */
export type AIModelFeature = AIFeature;

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
  /** Whether the resolved model supports reasoning/thinking */
  reasoning?: boolean;
  /** Provider-specific options (e.g. reasoning config) */
  providerOptions?: Record<string, Record<string, unknown>>;
};

export type ResolveAIModelInput = {
  userId: string;
  feature: AIModelFeature;
  /** Optional override model (ApiModel.id or ApiModel.modelKey) */
  modelId?: string;
};
