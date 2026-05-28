import { ProviderType } from '@prisma/client';

/**
 * API Provider Domain Types
 *
 * Type definitions related to AI API providers.
 */

/**
 * API provider model information
 */
export type ApiModel = {
  id: string;
  name: string;
  description?: string;
  modelKey: string;
  displayName: string | null;
  isActive: boolean;
};

/**
 * Complete API provider information including models (application boundary).
 */
export type ApiProvider = {
  id: string;
  name: string;
  provider: string;
  keyPreview: string;
  models: ApiModel[];
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
};

/**
 * Complete API provider information including models
 */
export type ApiProviderWithModels = {
  id: string;
  name: string;
  provider: ProviderType;
  keyPreview: string;
  models: ApiModel[];
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
};

/**
 * Input for creating a new API provider
 */
export interface CreateApiProviderInput {
  name: string;
  provider: ProviderType;
  encryptedKey: string;
  keyPreview?: string;
  isActive?: boolean;
}

/**
 * Input for updating an API provider
 */
export interface UpdateApiProviderInput {
  name?: string;
  isActive?: boolean;
  keyPreview?: string;
  keyVersion?: number;
  lastUsedIp?: string;
}


