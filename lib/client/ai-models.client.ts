import { API_V1 } from '@/lib/constants';
import { apiJson } from '@/lib/utils/api-client';

export type ModelInfo = {
  id: string;
  name: string;
  description?: string;
};

export type ProviderWithModels = {
  id: string;
  name: string;
  provider: string;
  models: ModelInfo[];
  isActive: boolean;
};

export type FeatureConfig = {
  id: string;
  name: string;
  description: string;
};

export type FeatureModelSelection = {
  feature: FeatureConfig;
  providerId: string | null;
  providerName: string | null;
  modelId: string | null;
  modelName: string | null;
};

export type AISettings = {
  features: FeatureModelSelection[];
  availableProviders: ProviderWithModels[];
};

export type UpdateAIPreferenceInput = {
  feature: string;
  providerId: string | null;
  modelId: string | null;
};

export async function getAISettings(): Promise<{ data: AISettings | null; error: string | null }> {
  const result = await apiJson<AISettings>(API_V1.SETTINGS.AI_MODELS);
  return { data: result.data, error: result.error };
}

export async function updateAIPreference(
  input: UpdateAIPreferenceInput
): Promise<{ data: unknown | null; error: string | null }> {
  const result = await apiJson<unknown>(API_V1.SETTINGS.AI_MODELS, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      feature: input.feature,
      providerId: input.providerId,
      modelId: input.modelId,
    }),
  });

  return { data: result.data, error: result.error };
}
