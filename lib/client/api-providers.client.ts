import { API_V1 } from '@/lib/constants';
import { apiJson } from '@/lib/utils/api-client';

export type ModelInfo = {
  id: string;
  name: string;
  description?: string;
};

export type ApiProvider = {
  id: string;
  name: string;
  provider: string;
  keyPreview: string;
  models: ModelInfo[];
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
};

export type AddApiProviderInput = {
  name: string;
  provider: string;
  apiKey: string;
};

export async function listApiProvidersForSettings(): Promise<{ data: ApiProvider[] | null; error: string | null }> {
  const result = await apiJson<ApiProvider[]>(API_V1.SETTINGS.API_PROVIDERS);
  return { data: result.data, error: result.error };
}

export async function addApiProvider(
  input: AddApiProviderInput
): Promise<{ data: unknown | null; error: string | null }> {
  const result = await apiJson<unknown>(API_V1.SETTINGS.API_PROVIDERS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return { data: result.data, error: result.error };
}

export async function deleteApiProvider(id: string): Promise<{ data: unknown | null; error: string | null }> {
  const result = await apiJson<unknown>(API_V1.SETTINGS.API_PROVIDER(id), {
    method: 'DELETE',
  });

  return { data: result.data, error: result.error };
}

export async function toggleApiProvider(
  id: string,
  isActive: boolean
): Promise<{ data: unknown | null; error: string | null }> {
  const result = await apiJson<unknown>(API_V1.SETTINGS.API_PROVIDER(id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });

  return { data: result.data, error: result.error };
}
