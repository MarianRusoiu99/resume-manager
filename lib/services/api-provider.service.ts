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
import { type ServiceResult } from '@/lib/types/service-result';
import { 
  withServiceError, 
  NotFoundError, 
  ValidationError, 
  UnauthorizedError, 
  ExternalServiceError 
} from '@/lib/services/utils';
import { logger } from '@/lib/utils/logger';

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
    return withServiceError('add provider', async () => {
      if (!isProviderSupported(input.provider)) {
        const supported = getSupportedProviders().join(', ');
        throw new ValidationError(`Unsupported provider: ${input.provider}. Supported: ${supported}`);
      }

      const providerInstance = createProvider(input.provider, input.apiKey);

      if (!providerInstance.validateApiKey(input.apiKey)) {
        throw new ValidationError(`Invalid API key format for ${providerInstance.name}`);
      }

      // Fetch models from the provider API
      let models: AIModel[];
      try {
        const allModels = await providerInstance.fetchModels();

        // Filter to only text/chat models
        models = filterTextModels(allModels);

        if (!models || models.length === 0) {
          throw new ValidationError('No text models available for this API key. Please check your API key permissions.');
        }
      } catch (error) {
        if (error instanceof ValidationError) throw error;
        throw new ExternalServiceError(
          providerInstance.name,
          error instanceof Error ? error.message : 'Failed to fetch models from provider API'
        );
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
          throw new UnauthorizedError('Session expired. Please log out and log back in.');
        }
        throw dbError;
      }

      // Audit log the key creation
      const auditContext = input.auditContext || { userId: input.userId };
      await apiKeyAuditService.logKeyCreated(provider.id, auditContext, {
        provider: input.provider,
        name: input.name,
      });

      return {
        id: provider.id,
        name: provider.name,
        provider: provider.provider.toLowerCase(), // Convert back to lowercase
        keyPreview,
        models,
        isActive: provider.isActive,
        createdAt: provider.createdAt,
      };
    });
  }

  async getUserProvidersWithModels(userId: string, auditContext?: AuditContext): Promise<ServiceResult<ProviderWithModels[]>> {
    return withServiceError('fetch providers with models', async () => {
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

      return providersWithModels;
    });
  }

  async getUserProviders(userId: string): Promise<ServiceResult<ProviderListItem[]>> {
    return withServiceError('fetch user providers', async () => {
      const providers = await apiProviderRepository.findByUserId(userId, true);

      return providers.map((p) => {
        const providerType = p.provider.toLowerCase(); // Convert from DB enum to lowercase
        const keyPreview = this.getStoredKeyPreview(providerType);

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
      });
    });
  }

  private getStoredKeyPreview(providerType: string): string {
    return createKeyPreview(providerType);
  }

  async getProviderInstance(
    providerId: string,
    userId: string,
    auditContext?: AuditContext
  ): Promise<ServiceResult<ProviderInstanceData>> {
    return withServiceError('get provider instance', async () => {
      const provider = await apiProviderRepository.findById(providerId, userId);

      if (!provider) {
        throw new NotFoundError('Provider');
      }

      // Check if provider is revoked
      if (provider.revokedAt) {
        throw new ValidationError('Provider key has been revoked');
      }

      if (!provider.isActive) {
        throw new ValidationError('Provider is inactive');
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

      return {
        provider: providerInstance,
        providerType: providerType, // Use lowercase
      };
    });
  }

  async getAvailableModels(userId: string): Promise<ServiceResult<AvailableModelsData>> {
    return withServiceError('fetch available models', async () => {
      const result = await this.getUserProvidersWithModels(userId);

      if (!result.success) {
        throw new Error(result.error);
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
        providers: activeProviders,
        allModels,
      };
    });
  }

  async updateProvider(
    providerId: string,
    userId: string,
    input: UpdateApiProviderInput
  ): Promise<ServiceResult<{ message: string }>> {
    return withServiceError('update provider', async () => {
      const provider = await apiProviderRepository.findById(providerId, userId);
      if (!provider) {
        throw new NotFoundError('Provider');
      }

      const updateData: Record<string, unknown> = {};

      if (input.name !== undefined) {
        updateData.name = input.name;
      }

      if (input.apiKey !== undefined) {
        const providerType = provider.provider.toLowerCase(); // Convert from DB enum to lowercase
        const providerInstance = createProvider(providerType, input.apiKey);

        if (!providerInstance.validateApiKey(input.apiKey)) {
          throw new ValidationError(`Invalid API key format for ${providerInstance.name}`);
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

      return { message: 'Provider updated successfully' };
    });
  }

  async deleteProvider(
    providerId: string,
    userId: string,
    auditContext?: AuditContext
  ): Promise<ServiceResult<{ message: string }>> {
    return withServiceError('delete provider', async () => {
      // Log deletion before actually deleting
      const context = auditContext || { userId };
      await apiKeyAuditService.logKeyDeleted(providerId, context, {
        reason: 'user_initiated',
      });
      
      await apiProviderRepository.delete(providerId, userId);
      return { message: 'Provider deleted successfully' };
    });
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
    return withServiceError('revoke provider', async () => {
      const provider = await apiProviderRepository.findById(providerId, userId);
      if (!provider) {
        throw new NotFoundError('Provider');
      }

      if (provider.revokedAt) {
        throw new ValidationError('Provider is already revoked');
      }

      await apiProviderRepository.update(providerId, userId, {
        revokedAt: new Date(),
        isActive: false,
      });

      // Log revocation
      const context = auditContext || { userId };
      await apiKeyAuditService.logKeyRevoked(providerId, context, { reason });

      return { message: 'Provider key revoked successfully' };
    });
  }

  async toggleProvider(providerId: string, userId: string, isActive: boolean): Promise<ServiceResult<{ message: string }>> {
    return withServiceError('toggle provider', async () => {
      // Check if revoked - cannot re-enable revoked keys
      const provider = await apiProviderRepository.findById(providerId, userId);
      if (provider?.revokedAt && isActive) {
        throw new ValidationError('Cannot enable a revoked key. Please add a new key.');
      }
      
      await apiProviderRepository.toggleActive(providerId, userId, isActive);
      return { message: `Provider ${isActive ? 'enabled' : 'disabled'} successfully` };
    });
  }

  getSupportedProviders() {
    return getSupportedProviders().map((type) => ({
      id: type,
      name: getProviderName(type),
    }));
  }

  async validateApiKey(providerType: string, apiKey: string): Promise<ServiceResult<ValidationData>> {
    return withServiceError('validate API key', async () => {
      if (!isProviderSupported(providerType)) {
        throw new ValidationError('Unsupported provider type');
      }

      const providerInstance = createProvider(providerType, apiKey);

      if (!providerInstance.validateApiKey(apiKey)) {
        throw new ValidationError(`Invalid API key format for ${providerInstance.name}`);
      }

      const models = await providerInstance.fetchModels();

      return {
        valid: true,
        modelsCount: models.length,
      };
    });
  }

  /**
   * Get the first active provider for a user with decrypted API key
   * Used for features that need an API key but don't have a specific model selected
   */
  async getFirstActiveProvider(
    userId: string,
    auditContext?: AuditContext
  ): Promise<ServiceResult<{ apiKey: string; providerType: string; providerId: string }>> {
    return withServiceError('get first active provider', async () => {
      const providers = await apiProviderRepository.findByUserId(userId, true);
      // Find first active AND non-revoked provider
      const activeProvider = providers.find(p => p.isActive && !p.revokedAt);

      if (!activeProvider) {
        throw new NotFoundError('No active API provider configured. Please add one in Settings → API Keys');
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

      return {
        apiKey,
        providerType,
        providerId: activeProvider.id,
      };
    });
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
