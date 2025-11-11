/**
 * API Provider Service
 * Business logic for managing API providers with secure key encryption
 */

import { apiProviderRepository } from '@/lib/repositories/api-provider.repository';
import { encryptApiKey, decryptApiKey } from '@/lib/encryption/api-key';

export interface AddApiProviderInput {
  userId: string;
  name: string;
  provider: string;
  apiKey: string;
  models: string[];
}

export interface UpdateApiProviderInput {
  name?: string;
  apiKey?: string;
  models?: string[];
  isActive?: boolean;
}

// Provider configurations with available models
export const PROVIDER_CONFIGS = {
  openai: {
    name: 'OpenAI',
    models: [
      { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', description: 'Most capable model' },
      { id: 'gpt-4', name: 'GPT-4', description: 'High quality, slower' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Multimodal flagship model' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Affordable small model' },
    ],
    keyPrefix: 'sk-',
    // Updated pattern to support modern OpenAI key format with hyphens and underscores
    keyPattern: /^sk-[a-zA-Z0-9_-]{20,}$/,
  },
  anthropic: {
    name: 'Anthropic',
    models: [
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most capable' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fast and compact' },
    ],
    keyPrefix: 'sk-ant-',
    keyPattern: /^sk-ant-[a-zA-Z0-9-_]{95,}$/,
  },
  google: {
    name: 'Google AI',
    models: [
      { id: 'gemini-pro', name: 'Gemini Pro', description: 'Most capable' },
      { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', description: 'Multimodal' },
    ],
    keyPrefix: 'AIza',
    keyPattern: /^AIza[a-zA-Z0-9_-]{35}$/,
  },
} as const;

export type ProviderType = keyof typeof PROVIDER_CONFIGS;

class ApiProviderService {
  /**
   * Add a new API provider with encrypted key
   */
  async addProvider(input: AddApiProviderInput) {
    try {
      // Validate provider type
      if (!PROVIDER_CONFIGS[input.provider as ProviderType]) {
        return {
          success: false,
          error: `Unsupported provider: ${input.provider}`,
        };
      }

      // Validate API key format
      const providerConfig = PROVIDER_CONFIGS[input.provider as ProviderType];
      if (!providerConfig.keyPattern.test(input.apiKey)) {
        // Log key format for debugging (without revealing the actual key)
        console.error('API key validation failed:', {
          provider: input.provider,
          keyPrefix: input.apiKey.substring(0, 8),
          keyLength: input.apiKey.length,
          expectedPattern: providerConfig.keyPattern.toString(),
        });
        return {
          success: false,
          error: `Invalid API key format for ${providerConfig.name}. Expected format: ${providerConfig.keyPrefix}...`,
        };
      }

      // Encrypt the API key
      const encryptedKey = encryptApiKey(input.apiKey);

      // Create key preview (first 8 characters + "...")
      const keyPreview = input.apiKey.substring(0, 12) + '...';

      // Create provider
      const provider = await apiProviderRepository.create({
        userId: input.userId,
        name: input.name,
        provider: input.provider,
        encryptedKey,
        keyPreview,
        models: input.models,
      });

      return {
        success: true,
        data: {
          id: provider.id,
          name: provider.name,
          provider: provider.provider,
          keyPreview: provider.keyPreview,
          models: provider.models as string[],
          isActive: provider.isActive,
          createdAt: provider.createdAt,
        },
      };
    } catch (error) {
      console.error('Error adding API provider:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add provider',
      };
    }
  }

  /**
   * Get all providers for a user (without decrypted keys)
   */
  async getUserProviders(userId: string) {
    try {
      const providers = await apiProviderRepository.findByUserId(userId);

      return {
        success: true,
        data: providers.map((p) => ({
          id: p.id,
          name: p.name,
          provider: p.provider,
          keyPreview: p.keyPreview,
          models: p.models as string[],
          isActive: p.isActive,
          createdAt: p.createdAt,
          lastUsedAt: p.lastUsedAt,
        })),
      };
    } catch (error) {
      console.error('Error getting user providers:', error);
      return {
        success: false,
        error: 'Failed to fetch providers',
      };
    }
  }

  /**
   * Get decrypted API key for use in AI workflows
   */
  async getDecryptedKey(providerId: string, userId: string) {
    try {
      const provider = await apiProviderRepository.findById(providerId, userId);

      if (!provider) {
        return {
          success: false,
          error: 'Provider not found',
        };
      }

      if (!provider.isActive) {
        return {
          success: false,
          error: 'Provider is inactive',
        };
      }

      // Decrypt the key
      const apiKey = decryptApiKey(provider.encryptedKey);

      // Update last used timestamp
      await apiProviderRepository.updateLastUsed(providerId);

      return {
        success: true,
        data: {
          apiKey,
          provider: provider.provider,
          models: provider.models as string[],
        },
      };
    } catch (error) {
      console.error('Error decrypting API key:', error);
      return {
        success: false,
        error: 'Failed to decrypt API key',
      };
    }
  }

  /**
   * Get all available models from all active providers
   */
  async getAvailableModels(userId: string) {
    try {
      const providers = await apiProviderRepository.getActiveProvidersWithModels(userId);

      const modelsByProvider = providers.map((provider) => {
        const providerConfig = PROVIDER_CONFIGS[provider.provider as ProviderType];
        
        return {
          providerId: provider.id,
          providerName: provider.name,
          providerType: provider.provider,
          models: (provider.models as string[]).map((modelId) => {
            const modelInfo = providerConfig.models.find((m) => m.id === modelId);
            return {
              id: modelId,
              name: modelInfo?.name || modelId,
              description: modelInfo?.description || '',
              providerId: provider.id,
              providerType: provider.provider,
            };
          }),
        };
      });

      // Flatten all models
      const allModels = modelsByProvider.flatMap((p) => p.models);

      return {
        success: true,
        data: {
          providers: modelsByProvider,
          allModels,
        },
      };
    } catch (error) {
      console.error('Error getting available models:', error);
      return {
        success: false,
        error: 'Failed to fetch models',
      };
    }
  }

  /**
   * Update a provider
   */
  async updateProvider(
    providerId: string,
    userId: string,
    input: UpdateApiProviderInput
  ) {
    try {
      const updateData: Record<string, unknown> = {};

      if (input.name !== undefined) {
        updateData.name = input.name;
      }

      if (input.apiKey !== undefined) {
        // Validate and encrypt new key
        const provider = await apiProviderRepository.findById(providerId, userId);
        if (!provider) {
          return { success: false, error: 'Provider not found' };
        }

        const providerConfig = PROVIDER_CONFIGS[provider.provider as ProviderType];
        if (!providerConfig.keyPattern.test(input.apiKey)) {
          return {
            success: false,
            error: `Invalid API key format for ${providerConfig.name}`,
          };
        }

        updateData.encryptedKey = encryptApiKey(input.apiKey);
        updateData.keyPreview = input.apiKey.substring(0, 12) + '...';
      }

      if (input.models !== undefined) {
        updateData.models = input.models;
      }

      if (input.isActive !== undefined) {
        updateData.isActive = input.isActive;
      }

      await apiProviderRepository.update(providerId, userId, updateData);

      return {
        success: true,
        message: 'Provider updated successfully',
      };
    } catch (error) {
      console.error('Error updating provider:', error);
      return {
        success: false,
        error: 'Failed to update provider',
      };
    }
  }

  /**
   * Delete a provider
   */
  async deleteProvider(providerId: string, userId: string) {
    try {
      await apiProviderRepository.delete(providerId, userId);

      return {
        success: true,
        message: 'Provider deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting provider:', error);
      return {
        success: false,
        error: 'Failed to delete provider',
      };
    }
  }

  /**
   * Toggle provider active status
   */
  async toggleProvider(providerId: string, userId: string, isActive: boolean) {
    try {
      await apiProviderRepository.toggleActive(providerId, userId, isActive);

      return {
        success: true,
        message: `Provider ${isActive ? 'enabled' : 'disabled'} successfully`,
      };
    } catch (error) {
      console.error('Error toggling provider:', error);
      return {
        success: false,
        error: 'Failed to toggle provider',
      };
    }
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(providerType: string) {
    return PROVIDER_CONFIGS[providerType as ProviderType];
  }

  /**
   * Get all supported providers
   */
  getSupportedProviders() {
    return Object.entries(PROVIDER_CONFIGS).map(([key, value]) => ({
      id: key,
      name: value.name,
      models: value.models,
    }));
  }
}

export const apiProviderService = new ApiProviderService();
