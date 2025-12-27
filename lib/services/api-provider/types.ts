/**
 * API Provider service types
 *
 * Kept in a dedicated module to avoid circular deps
 * and to make the facade (`api-provider.service.ts`) small.
 */

import type { AIModel } from '@/lib/ai/providers';
import type { AuditContext } from '../api-key-audit';

/**
 * A model configured/stored for a provider.
 *
 * `id` is the database id (`ApiModel.id`).
 * `modelKey` is the provider-native model identifier (e.g. `gpt-4o`).
 */
export type ConfiguredModelInfo = Omit<AIModel, 'id'> & {
  id: string;
  modelKey: string;
};

export interface AddApiProviderInput {
  userId: string;
  name: string;
  provider: string;
  apiKey: string;
  auditContext?: AuditContext;
}

export interface UpdateApiProviderInput {
  name?: string;
  apiKey?: string;
  isActive?: boolean;
  auditContext?: AuditContext;
}

export interface ProviderWithModels {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  models: ConfiguredModelInfo[];
  keyPreview: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}

export interface ProviderInfo {
  id: string;
  name: string;
  provider: string;
  keyPreview: string;
  models: ConfiguredModelInfo[];
  isActive: boolean;
  createdAt: Date;
}

export interface ProviderListItem {
  id: string;
  name: string;
  provider: string;
  providerName: string;
  keyPreview: string;
  // Stored model identifiers for this provider
  models: string[];
  isActive: boolean;
  createdAt: Date;
  lastUsedAt: Date | null;
}

export interface ProviderInstanceData {
  provider: import('@/lib/ai/providers').AIProvider;
  providerType: string;
}

export interface AvailableModelsData {
  providers: ProviderWithModels[];
  allModels: Array<
    ConfiguredModelInfo & {
      uniqueId: string;
      providerId: string;
      providerType: string;
      providerName: string;
    }
  >;
}

export interface ValidationData {
  valid: boolean;
  modelsCount: number;
}
