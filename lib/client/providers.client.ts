import { API_V1 } from '@/lib/constants';
import { apiJson } from '@/lib/utils/api-client';
import type { AIModel } from '@/lib/ai/providers';

export type ProviderWithModels = {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  models: AIModel[];
  keyPreview: string;
  createdAt: string | Date;
  lastUsedAt: string | Date | null;
};

export async function listApiProviders(): Promise<{ data: ProviderWithModels[] | null; error: string | null }> {
  const result = await apiJson<ProviderWithModels[]>(API_V1.SETTINGS.API_PROVIDERS);
  return { data: result.data, error: result.error };
}
