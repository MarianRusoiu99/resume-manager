/**
 * Shared types for Server Actions (application boundary).
 * 
 * @deprecated Use domain-specific types in '@/lib/types/' instead.
 */

export * from '@/lib/types';
export * from '@/lib/types';
export * from '@/lib/types';


// Shared types for UI components to avoid direct lib/client or lib/services imports

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

export type ProfileListItem = {
  id: string;
  name: string;
  isDefault: boolean;
};

export type AISettings = {
  features: FeatureModelSelection[];
  availableProviders: ProviderWithModels[];
};

export type FeatureModelSelection = {
  feature: {
    id: string;
    name: string;
    description: string;
  };
  providerId: string | null;
  providerName: string | null;
  modelId: string | null;
  modelName: string | null;
};

export type ProviderWithModels = {
  id: string;
  name: string;
  provider: string;
  models: ModelInfo[];
  isActive: boolean;
};
