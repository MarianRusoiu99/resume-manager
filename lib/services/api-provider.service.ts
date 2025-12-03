/**
 * API Provider Service
 * Business logic for managing API providers with secure key encryption
 */

import { apiProviderRepository } from '@/lib/repositories/api-provider.repository';
import { encryptApiKey, decryptApiKey } from '@/lib/encryption/api-key';
import {
  createProvider,
  getSupportedProviders,
  isProviderSupported,
  getProviderName,
  type AIModel,
} from '@/lib/ai/providers';
import { logger } from '@/lib/utils/logger';
import { success, failure, type ServiceResult } from '@/lib/types/service-result';

export interface AddApiProviderInput {
  userId: string;
  name: string;
  provider: string;
  apiKey: string;
}

export interface UpdateApiProviderInput {
  name?: string;
  apiKey?: string;
  isActive?: boolean;
}

export interface ProviderWithModels {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  models: AIModel[];
  keyPreview: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}

export interface ProviderInfo {
  id: string;
  name: string;
  provider: string;
  keyPreview: string;
  models: AIModel[];
  isActive: boolean;
  createdAt: Date;
}

export interface ProviderListItem {
  id: string;
  name: string;
  provider: string;
  providerName: string;
  keyPreview: string;
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
  allModels: Array<AIModel & { uniqueId: string; providerId: string; providerType: string; providerName: string }>;
}

export interface ValidationData {
  valid: boolean;
  modelsCount: number;
}

/**
 * Filter models to only include text/chat models
 * Excludes image, audio, embedding, and moderation models
 */
function filterTextModels(models: AIModel[]): AIModel[] {
  return models.filter(model => {
    const modelId = model.id.toLowerCase();
    const modelName = (model.name || '').toLowerCase();

    // Exclude non-text models
    const isNonTextModel =
      modelId.includes('dall-e') ||
      modelId.includes('whisper') ||
      modelId.includes('tts') ||
      modelId.includes('embedding') ||
      modelId.includes('moderation') ||
      modelId.includes('vision') ||
      modelId.startsWith('text-embedding') ||
      modelName.includes('vision') ||
      modelName.includes('image') ||
      modelName.includes('audio');

    return !isNonTextModel;
  });
}

class ApiProviderService {
  async addProvider(input: AddApiProviderInput): Promise<ServiceResult<ProviderInfo>> {
    try {
      if (!isProviderSupported(input.provider)) {
        const supported = getSupportedProviders().join(', ');
        return failure(`Unsupported provider: ${input.provider}. Supported: ${supported}`, 'VALIDATION_ERROR');
      }

      const providerInstance = createProvider(input.provider, input.apiKey);

      if (!providerInstance.validateApiKey(input.apiKey)) {
        return failure(`Invalid API key format for ${providerInstance.name}`, 'VALIDATION_ERROR');
      }

      // Fetch models from the provider API
      let models: AIModel[];
      try {
        const allModels = await providerInstance.fetchModels();

        // Filter to only text/chat models
        models = filterTextModels(allModels);

        if (!models || models.length === 0) {
          return failure('No text models available for this API key. Please check your API key permissions.', 'VALIDATION_ERROR');
        }
      } catch (error) {
        return failure(error instanceof Error ? error.message : 'Failed to fetch models from provider API', 'EXTERNAL_SERVICE_ERROR');
      }

      const encryptedKey = encryptApiKey(input.apiKey);
      const keyPreview = providerInstance.getKeyPreview(input.apiKey);

      // Store model IDs in database
      const modelIds = models.map((m) => m.id);

      const provider = await apiProviderRepository.create({
        userId: input.userId,
        name: input.name,
        provider: input.provider, // Repository will convert to uppercase
        encryptedKey,
        models: modelIds,
      });

      return success({
        id: provider.id,
        name: provider.name,
        provider: provider.provider.toLowerCase(), // Convert back to lowercase
        keyPreview,
        models,
        isActive: provider.isActive,
        createdAt: provider.createdAt,
      });
    } catch (error) {
      logger.error('Error adding API provider', error);
      return failure(error instanceof Error ? error.message : 'Failed to add provider', 'INTERNAL_ERROR');
    }
  }

  async getUserProvidersWithModels(userId: string): Promise<ServiceResult<ProviderWithModels[]>> {
    try {
      const providers = await apiProviderRepository.findByUserId(userId, true);
      const providersWithModels: ProviderWithModels[] = [];

      for (const provider of providers) {
        try {
          const apiKey = decryptApiKey(provider.encryptedKey);
          const providerType = provider.provider.toLowerCase(); // Convert from DB enum to lowercase
          const providerInstance = createProvider(providerType, apiKey);

          // Fetch current models from API to get full model details
          const allModels = await providerInstance.fetchModels();

          // Filter to only text/chat models
          const textModels = filterTextModels(allModels);

          // Filter to only include models that are stored in the database
          const storedModelIds = provider.models;
          const filteredModels = textModels.filter((m) => storedModelIds.includes(m.id));

          const keyPreview = providerInstance.getKeyPreview(apiKey);

          providersWithModels.push({
            id: provider.id,
            name: provider.name,
            provider: providerType, // Use lowercase
            isActive: provider.isActive,
            models: filteredModels,
            keyPreview,
            createdAt: provider.createdAt,
            lastUsedAt: provider.lastUsedAt,
          });
        } catch (error) {
          logger.error(`Failed to fetch models for provider ${provider.id}`, error);
          // Return provider with empty models array on error
          providersWithModels.push({
            id: provider.id,
            name: provider.name,
            provider: provider.provider.toLowerCase(),
            isActive: false,
            models: [],
            keyPreview: '***...***',
            createdAt: provider.createdAt,
            lastUsedAt: provider.lastUsedAt,
          });
        }
      }

      return success(providersWithModels);
    } catch (error) {
      logger.error('Error getting user providers', error);
      return failure('Failed to fetch providers', 'INTERNAL_ERROR');
    }
  }

  async getUserProviders(userId: string): Promise<ServiceResult<ProviderListItem[]>> {
    try {
      const providers = await apiProviderRepository.findByUserId(userId, true);

      return success(providers.map((p) => {
        const providerType = p.provider.toLowerCase(); // Convert from DB enum to lowercase
        const keyPreview = this.getStoredKeyPreview(providerType, p.encryptedKey);

        return {
          id: p.id,
          name: p.name,
          provider: providerType, // Use lowercase
          providerName: getProviderName(providerType),
          keyPreview,
          models: p.models, // Return stored model IDs
          isActive: p.isActive,
          createdAt: p.createdAt,
          lastUsedAt: p.lastUsedAt,
        };
      }));
    } catch (error) {
      logger.error('Error getting user providers', error);
      return failure('Failed to fetch providers', 'INTERNAL_ERROR');
    }
  }

  private getStoredKeyPreview(providerType: string, _encryptedKey: string): string {
    const previews: Record<string, string> = {
      openai: 'sk-proj-...',
      anthropic: 'sk-ant-...',
      google: 'AIza...',
    };
    return previews[providerType] || '***...***';
  }

  async getProviderInstance(providerId: string, userId: string): Promise<ServiceResult<ProviderInstanceData>> {
    try {
      const provider = await apiProviderRepository.findById(providerId, userId);

      if (!provider) {
        return failure('Provider not found', 'NOT_FOUND');
      }

      if (!provider.isActive) {
        return failure('Provider is inactive', 'VALIDATION_ERROR');
      }

      const apiKey = decryptApiKey(provider.encryptedKey);
      const providerType = provider.provider.toLowerCase(); // Convert from DB enum to lowercase
      const providerInstance = createProvider(providerType, apiKey);
      await apiProviderRepository.updateLastUsed(providerId);

      return success({
        provider: providerInstance,
        providerType: providerType, // Use lowercase
      });
    } catch (error) {
      logger.error('Error getting provider instance', error);
      return failure(error instanceof Error ? error.message : 'Failed to get provider', 'INTERNAL_ERROR');
    }
  }

  async getAvailableModels(userId: string): Promise<ServiceResult<AvailableModelsData>> {
    try {
      const result = await this.getUserProvidersWithModels(userId);

      if (!result.success) {
        return failure(result.error, 'INTERNAL_ERROR');
      }

      const activeProviders = result.data.filter((p) => p.isActive);

      // Create unique model entries with composite keys
      const allModels = activeProviders.flatMap((provider) =>
        provider.models.map((model) => ({
          ...model,
          // Create unique ID by combining provider ID and model ID
          uniqueId: `${provider.id}-${model.id}`,
          providerId: provider.id,
          providerType: provider.provider, // Already lowercase from getUserProvidersWithModels
          providerName: getProviderName(provider.provider),
        }))
      );

      return success({
        providers: activeProviders,
        allModels,
      });
    } catch (error) {
      logger.error('Error getting available models', error);
      return failure('Failed to fetch models', 'INTERNAL_ERROR');
    }
  }

  async updateProvider(
    providerId: string,
    userId: string,
    input: UpdateApiProviderInput
  ): Promise<ServiceResult<{ message: string }>> {
    try {
      const provider = await apiProviderRepository.findById(providerId, userId);
      if (!provider) {
        return failure('Provider not found', 'NOT_FOUND');
      }

      const updateData: Record<string, unknown> = {};

      if (input.name !== undefined) {
        updateData.name = input.name;
      }

      if (input.apiKey !== undefined) {
        const providerType = provider.provider.toLowerCase(); // Convert from DB enum to lowercase
        const providerInstance = createProvider(providerType, input.apiKey);

        if (!providerInstance.validateApiKey(input.apiKey)) {
          return failure(`Invalid API key format for ${providerInstance.name}`, 'VALIDATION_ERROR');
        }

        updateData.encryptedKey = encryptApiKey(input.apiKey);
      }

      if (input.isActive !== undefined) {
        updateData.isActive = input.isActive;
      }

      await apiProviderRepository.update(providerId, userId, updateData);

      return success({ message: 'Provider updated successfully' });
    } catch (error) {
      logger.error('Error updating provider', error);
      return failure(error instanceof Error ? error.message : 'Failed to update provider', 'INTERNAL_ERROR');
    }
  }

  async deleteProvider(providerId: string, userId: string): Promise<ServiceResult<{ message: string }>> {
    try {
      await apiProviderRepository.delete(providerId, userId);
      return success({ message: 'Provider deleted successfully' });
    } catch (error) {
      logger.error('Error deleting provider', error);
      return failure('Failed to delete provider', 'INTERNAL_ERROR');
    }
  }

  async toggleProvider(providerId: string, userId: string, isActive: boolean): Promise<ServiceResult<{ message: string }>> {
    try {
      await apiProviderRepository.toggleActive(providerId, userId, isActive);
      return success({ message: `Provider ${isActive ? 'enabled' : 'disabled'} successfully` });
    } catch (error) {
      logger.error('Error toggling provider', error);
      return failure('Failed to toggle provider', 'INTERNAL_ERROR');
    }
  }

  getSupportedProviders() {
    return getSupportedProviders().map((type) => ({
      id: type,
      name: getProviderName(type),
    }));
  }

  async validateApiKey(providerType: string, apiKey: string): Promise<ServiceResult<ValidationData>> {
    try {
      if (!isProviderSupported(providerType)) {
        return failure('Unsupported provider type', 'VALIDATION_ERROR');
      }

      const providerInstance = createProvider(providerType, apiKey);

      if (!providerInstance.validateApiKey(apiKey)) {
        return failure(`Invalid API key format for ${providerInstance.name}`, 'VALIDATION_ERROR');
      }

      const models = await providerInstance.fetchModels();

      return success({
        valid: true,
        modelsCount: models.length,
      });
    } catch (error) {
      return failure(error instanceof Error ? error.message : 'API key validation failed', 'EXTERNAL_SERVICE_ERROR');
    }
  }

  /**
   * Get the first active provider for a user with decrypted API key
   * Used for features that need an API key but don't have a specific model selected
   */
  async getFirstActiveProvider(userId: string): Promise<ServiceResult<{ apiKey: string; providerType: string; providerId: string }>> {
    try {
      const providers = await apiProviderRepository.findByUserId(userId, true);
      const activeProvider = providers.find(p => p.isActive);

      if (!activeProvider) {
        return failure('No active API provider configured. Please add one in Settings → API Keys', 'NOT_FOUND');
      }

      const apiKey = decryptApiKey(activeProvider.encryptedKey);
      const providerType = activeProvider.provider.toLowerCase();

      return success({
        apiKey,
        providerType,
        providerId: activeProvider.id,
      });
    } catch (error) {
      logger.error('Error getting first active provider', error);
      return failure(error instanceof Error ? error.message : 'Failed to get provider', 'INTERNAL_ERROR');
    }
  }
}

export const apiProviderService = new ApiProviderService();
