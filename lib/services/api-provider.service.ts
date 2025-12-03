/**
 * API Provider Service
 * Business logic for managing API providers with secure key encryption
 * and comprehensive audit logging
 */

import { apiProviderRepository } from '@/lib/repositories/api-provider.repository';
import { encryptApiKey, decryptApiKey, createKeyPreview } from '@/lib/encryption/api-key';
import { apiKeyAuditService, type AuditContext } from './api-key-audit.service';
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
      // Use secure preview that doesn't expose actual key characters
      const keyPreview = createKeyPreview(input.provider);

      // Store model IDs in database
      const modelIds = models.map((m) => m.id);

      let provider;
      try {
        provider = await apiProviderRepository.create({
          userId: input.userId,
          name: input.name,
          provider: input.provider, // Repository will convert to uppercase
          encryptedKey,
          models: modelIds,
        });
      } catch (dbError) {
        // Handle foreign key constraint violation (user doesn't exist)
        if (dbError instanceof Error && dbError.message.includes('Foreign key constraint')) {
          logger.error('User not found when adding API provider - session may be stale', { userId: input.userId });
          return failure('Session expired. Please log out and log back in.', 'UNAUTHORIZED');
        }
        throw dbError;
      }

      // Audit log the key creation
      const auditContext = input.auditContext || { userId: input.userId };
      await apiKeyAuditService.logKeyCreated(provider.id, auditContext, {
        provider: input.provider,
        name: input.name,
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

  async getUserProvidersWithModels(userId: string, auditContext?: AuditContext): Promise<ServiceResult<ProviderWithModels[]>> {
    try {
      const providers = await apiProviderRepository.findByUserId(userId, true);
      const providersWithModels: ProviderWithModels[] = [];

      for (const provider of providers) {
        // Skip revoked providers
        if (provider.revokedAt) {
          continue;
        }

        try {
          const apiKey = decryptApiKey(provider.encryptedKey);
          const providerType = provider.provider.toLowerCase(); // Convert from DB enum to lowercase
          const providerInstance = createProvider(providerType, apiKey);

          // Log decryption for audit trail (only for sensitive operations)
          if (auditContext) {
            await apiKeyAuditService.logKeyDecrypted(provider.id, auditContext, {
              endpoint: 'getUserProvidersWithModels',
              purpose: 'fetch_models',
            });
          }

          // Fetch current models from API to get full model details
          const allModels = await providerInstance.fetchModels();

          // Filter to only text/chat models
          const textModels = filterTextModels(allModels);

          // Filter to only include models that are stored in the database
          const storedModelIds = provider.models;
          const filteredModels = textModels.filter((m) => storedModelIds.includes(m.id));

          // Use secure preview
          const keyPreview = createKeyPreview(providerType);

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
            keyPreview: createKeyPreview(provider.provider.toLowerCase()),
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
    return createKeyPreview(providerType);
  }

  async getProviderInstance(
    providerId: string,
    userId: string,
    auditContext?: AuditContext
  ): Promise<ServiceResult<ProviderInstanceData>> {
    try {
      const provider = await apiProviderRepository.findById(providerId, userId);

      if (!provider) {
        return failure('Provider not found', 'NOT_FOUND');
      }

      // Check if provider is revoked
      if (provider.revokedAt) {
        return failure('Provider key has been revoked', 'VALIDATION_ERROR');
      }

      if (!provider.isActive) {
        return failure('Provider is inactive', 'VALIDATION_ERROR');
      }

      const apiKey = decryptApiKey(provider.encryptedKey);
      const providerType = provider.provider.toLowerCase(); // Convert from DB enum to lowercase
      const providerInstance = createProvider(providerType, apiKey);
      
      // Log decryption for audit trail
      if (auditContext) {
        await apiKeyAuditService.logKeyDecrypted(providerId, auditContext, {
          endpoint: 'getProviderInstance',
          purpose: 'api_call',
        });
      }
      
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
        // Increment key version on rotation
        updateData.keyVersion = (provider.keyVersion || 1) + 1;
        
        // Log key rotation
        const auditContext = input.auditContext || { userId };
        await apiKeyAuditService.logKeyRotated(providerId, auditContext, {
          keyVersion: updateData.keyVersion as number,
          reason: 'user_initiated',
        });
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

  async deleteProvider(
    providerId: string,
    userId: string,
    auditContext?: AuditContext
  ): Promise<ServiceResult<{ message: string }>> {
    try {
      // Log deletion before actually deleting
      const context = auditContext || { userId };
      await apiKeyAuditService.logKeyDeleted(providerId, context, {
        reason: 'user_initiated',
      });
      
      await apiProviderRepository.delete(providerId, userId);
      return success({ message: 'Provider deleted successfully' });
    } catch (error) {
      logger.error('Error deleting provider', error);
      return failure('Failed to delete provider', 'INTERNAL_ERROR');
    }
  }

  /**
   * Revoke a provider key without deleting it
   * This allows keeping audit history while preventing further use
   */
  async revokeProvider(
    providerId: string,
    userId: string,
    auditContext?: AuditContext,
    reason?: string
  ): Promise<ServiceResult<{ message: string }>> {
    try {
      const provider = await apiProviderRepository.findById(providerId, userId);
      if (!provider) {
        return failure('Provider not found', 'NOT_FOUND');
      }

      if (provider.revokedAt) {
        return failure('Provider is already revoked', 'VALIDATION_ERROR');
      }

      await apiProviderRepository.update(providerId, userId, {
        revokedAt: new Date(),
        isActive: false,
      });

      // Log revocation
      const context = auditContext || { userId };
      await apiKeyAuditService.logKeyRevoked(providerId, context, { reason });

      return success({ message: 'Provider key revoked successfully' });
    } catch (error) {
      logger.error('Error revoking provider', error);
      return failure('Failed to revoke provider', 'INTERNAL_ERROR');
    }
  }

  async toggleProvider(providerId: string, userId: string, isActive: boolean): Promise<ServiceResult<{ message: string }>> {
    try {
      // Check if revoked - cannot re-enable revoked keys
      const provider = await apiProviderRepository.findById(providerId, userId);
      if (provider?.revokedAt && isActive) {
        return failure('Cannot enable a revoked key. Please add a new key.', 'VALIDATION_ERROR');
      }
      
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
  async getFirstActiveProvider(
    userId: string,
    auditContext?: AuditContext
  ): Promise<ServiceResult<{ apiKey: string; providerType: string; providerId: string }>> {
    try {
      const providers = await apiProviderRepository.findByUserId(userId, true);
      // Find first active AND non-revoked provider
      const activeProvider = providers.find(p => p.isActive && !p.revokedAt);

      if (!activeProvider) {
        return failure('No active API provider configured. Please add one in Settings → API Keys', 'NOT_FOUND');
      }

      const apiKey = decryptApiKey(activeProvider.encryptedKey);
      const providerType = activeProvider.provider.toLowerCase();

      // Log decryption if audit context provided
      if (auditContext) {
        await apiKeyAuditService.logKeyDecrypted(activeProvider.id, auditContext, {
          endpoint: 'getFirstActiveProvider',
          purpose: 'api_call',
        });
      }

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

  /**
   * Log API key usage (call this after successful AI generation)
   */
  async logKeyUsage(
    providerId: string,
    auditContext: AuditContext,
    metadata: {
      endpoint: string;
      modelUsed?: string;
      tokensConsumed?: number;
      success?: boolean;
      errorMessage?: string;
    }
  ): Promise<void> {
    await apiKeyAuditService.logKeyUsed(providerId, auditContext, metadata);
  }

  /**
   * Get audit logs for a provider
   */
  async getProviderAuditLogs(
    providerId: string,
    userId: string,
    options?: { limit?: number; offset?: number }
  ) {
    return apiKeyAuditService.getProviderAuditLogs(providerId, userId, options);
  }

  /**
   * Get all audit logs for a user
   */
  async getUserAuditLogs(
    userId: string,
    options?: { limit?: number; offset?: number }
  ) {
    return apiKeyAuditService.getUserAuditLogs(userId, options);
  }
}

export const apiProviderService = new ApiProviderService();
