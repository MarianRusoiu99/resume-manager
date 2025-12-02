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
  async addProvider(input: AddApiProviderInput) {
    try {
      if (!isProviderSupported(input.provider)) {
        const supported = getSupportedProviders().join(', ');
        return {
          success: false,
          error: `Unsupported provider: ${input.provider}. Supported: ${supported}`,
        };
      }

      const providerInstance = createProvider(input.provider, input.apiKey);

      if (!providerInstance.validateApiKey(input.apiKey)) {
        return {
          success: false,
          error: `Invalid API key format for ${providerInstance.name}`,
        };
      }

      // Fetch models from the provider API
      let models: AIModel[];
      try {
        const allModels = await providerInstance.fetchModels();

        // Filter to only text/chat models
        models = filterTextModels(allModels);

        if (!models || models.length === 0) {
          return {
            success: false,
            error: 'No text models available for this API key. Please check your API key permissions.',
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch models from provider API',
        };
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

      return {
        success: true,
        data: {
          id: provider.id,
          name: provider.name,
          provider: provider.provider.toLowerCase(), // Convert back to lowercase
          keyPreview,
          models,
          isActive: provider.isActive,
          createdAt: provider.createdAt,
        },
      };
    } catch (error) {
      logger.error('Error adding API provider', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add provider',
      };
    }
  }

  async getUserProvidersWithModels(userId: string): Promise<{
    success: boolean;
    data?: ProviderWithModels[];
    error?: string;
  }> {
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

      return { success: true, data: providersWithModels };
    } catch (error) {
      logger.error('Error getting user providers', error);
      return { success: false, error: 'Failed to fetch providers' };
    }
  }

  async getUserProviders(userId: string) {
    try {
      const providers = await apiProviderRepository.findByUserId(userId, true);

      return {
        success: true,
        data: providers.map((p) => {
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
        }),
      };
    } catch (error) {
      logger.error('Error getting user providers', error);
      return { success: false, error: 'Failed to fetch providers' };
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

  async getProviderInstance(providerId: string, userId: string) {
    try {
      const provider = await apiProviderRepository.findById(providerId, userId);

      if (!provider) {
        return { success: false, error: 'Provider not found' };
      }

      if (!provider.isActive) {
        return { success: false, error: 'Provider is inactive' };
      }

      const apiKey = decryptApiKey(provider.encryptedKey);
      const providerType = provider.provider.toLowerCase(); // Convert from DB enum to lowercase
      const providerInstance = createProvider(providerType, apiKey);
      await apiProviderRepository.updateLastUsed(providerId);

      return {
        success: true,
        data: {
          provider: providerInstance,
          providerType: providerType, // Use lowercase
        },
      };
    } catch (error) {
      logger.error('Error getting provider instance', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get provider',
      };
    }
  }

  async getAvailableModels(userId: string) {
    try {
      const result = await this.getUserProvidersWithModels(userId);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || 'Failed to fetch providers',
        };
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

      return {
        success: true,
        data: {
          providers: activeProviders,
          allModels,
        },
      };
    } catch (error) {
      logger.error('Error getting available models', error);
      return { success: false, error: 'Failed to fetch models' };
    }
  }

  async updateProvider(
    providerId: string,
    userId: string,
    input: UpdateApiProviderInput
  ) {
    try {
      const provider = await apiProviderRepository.findById(providerId, userId);
      if (!provider) {
        return { success: false, error: 'Provider not found' };
      }

      const updateData: Record<string, unknown> = {};

      if (input.name !== undefined) {
        updateData.name = input.name;
      }

      if (input.apiKey !== undefined) {
        const providerType = provider.provider.toLowerCase(); // Convert from DB enum to lowercase
        const providerInstance = createProvider(providerType, input.apiKey);

        if (!providerInstance.validateApiKey(input.apiKey)) {
          return {
            success: false,
            error: `Invalid API key format for ${providerInstance.name}`,
          };
        }

        updateData.encryptedKey = encryptApiKey(input.apiKey);
      }

      if (input.isActive !== undefined) {
        updateData.isActive = input.isActive;
      }

      await apiProviderRepository.update(providerId, userId, updateData);

      return { success: true, message: 'Provider updated successfully' };
    } catch (error) {
      logger.error('Error updating provider', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update provider',
      };
    }
  }

  async deleteProvider(providerId: string, userId: string) {
    try {
      await apiProviderRepository.delete(providerId, userId);
      return { success: true, message: 'Provider deleted successfully' };
    } catch (error) {
      logger.error('Error deleting provider', error);
      return { success: false, error: 'Failed to delete provider' };
    }
  }

  async toggleProvider(providerId: string, userId: string, isActive: boolean) {
    try {
      await apiProviderRepository.toggleActive(providerId, userId, isActive);
      return {
        success: true,
        message: `Provider ${isActive ? 'enabled' : 'disabled'} successfully`,
      };
    } catch (error) {
      logger.error('Error toggling provider', error);
      return { success: false, error: 'Failed to toggle provider' };
    }
  }

  getSupportedProviders() {
    return getSupportedProviders().map((type) => ({
      id: type,
      name: getProviderName(type),
    }));
  }

  async validateApiKey(providerType: string, apiKey: string) {
    try {
      if (!isProviderSupported(providerType)) {
        return { success: false, error: 'Unsupported provider type' };
      }

      const providerInstance = createProvider(providerType, apiKey);

      if (!providerInstance.validateApiKey(apiKey)) {
        return {
          success: false,
          error: `Invalid API key format for ${providerInstance.name}`,
        };
      }

      const models = await providerInstance.fetchModels();

      return {
        success: true,
        data: {
          valid: true,
          modelsCount: models.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API key validation failed',
      };
    }
  }
}

export const apiProviderService = new ApiProviderService();
