/**
 * Shared types for Server Actions (application boundary).
 */

import type { ServiceResult } from '@/lib/types/service-result';
import type { Resume } from '@/lib/validations/jsonresume';

/**
 * Standard result type for all Server Actions.
 * This is an alias for ServiceResult to maintain semantic clarity
 * while avoiding type duplication.
 */
export type ActionResult<T> = ServiceResult<T>;

export type ProfileDto = {
  id: string;
  userId: string;
  name: string;
  resume: Resume | null;
  isDefault: boolean;
  isPublic: boolean;
  publicSlug: string | null;
  selectedTemplateId: string | null;
  createdAt: string;
  updatedAt: string;
};

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
