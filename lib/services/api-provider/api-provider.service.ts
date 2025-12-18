/**
 * API Provider Service
 *
 * Split out of `lib/services/api-provider.service.ts` to keep that file as a
 * stable facade and reduce coupling for consumers.
 */

import { apiProviderRepository, ApiProviderRepository } from '@/lib/repositories/api-provider.repository';
import { encryptApiKey, decryptApiKey, createKeyPreview } from '@/lib/encryption/api-key';
import { apiKeyAuditService, type AuditContext } from '../api-key-audit';
import {
  createProvider,
  getSupportedProviders,
  isProviderSupported,
  getProviderName,
  type AIModel,
} from '@/lib/ai/providers';
import { type ServiceResult, isFailure } from '@/lib/types/service-result';
import {
  withServiceError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ExternalServiceError,
} from '@/lib/services/utils';
import { logger } from '@/lib/utils/logger';
import { GenericUserOwnedCrudService } from '../utils/generic-crud.service';

import type {
  AddApiProviderInput,
  UpdateApiProviderInput,
  ProviderWithModels,
  ProviderInfo,
  ProviderListItem,
  ProviderInstanceData,
  AvailableModelsData,
  ValidationData,
} from './types';
import { ApiProviderWithModels, CreateApiProviderInput, UpdateApiProviderInput as RepoUpdateInput } from '@/lib/repositories/interfaces/api-provider.repository.interface';

export class ApiProviderService 
  extends GenericUserOwnedCrudService<ApiProviderWithModels, CreateApiProviderInput, RepoUpdateInput, ApiProviderRepository>
{
  constructor(repository: ApiProviderRepository = apiProviderRepository) {
    super(repository, 'ApiProvider');
  }
  async addProvider(input: AddApiProviderInput): Promise<ServiceResult<ProviderInfo>> {
    return withServiceError('add provider', async () => {
      if (!isProviderSupported(input.provider)) {
        const supported = getSupportedProviders().join(', ');
        throw new ValidationError(
          `Unsupported provider: ${input.provider}. Supported: ${supported}`
        );
      }

      const providerInstance = createProvider(input.provider, input.apiKey);

      if (!providerInstance.validateApiKey(input.apiKey)) {
        throw new ValidationError(`Invalid API key format for ${providerInstance.name}`);
      }

      let models: AIModel[];
      try {
        models = await providerInstance.fetchModels();

        if (!models || models.length === 0) {
          throw new ValidationError(
            'No text models available for this API key. Please check your API key permissions.'
          );
        }
      } catch (error) {
        if (error instanceof ValidationError) throw error;
        throw new ExternalServiceError(
          providerInstance.name,
          error instanceof Error ? error.message : 'Failed to fetch models from provider API'
        );
      }

       const encryptedKey = encryptApiKey(input.apiKey);
       const keyPreview = createKeyPreview(input.provider);
       const modelKeys = models.map((m) => m.id);

       let provider;
       try {
         provider = await apiProviderRepository.create({
           userId: input.userId,
           name: input.name,
           provider: input.provider,
           encryptedKey,
           models: modelKeys,
         });
       } catch (dbError) {
         if (dbError instanceof Error && dbError.message.includes('Foreign key constraint')) {
           throw new UnauthorizedError('Session expired. Please log out and log back in.');
         }
         throw dbError;
       }

       const auditContext = input.auditContext || { userId: input.userId };
       await apiKeyAuditService.logKeyCreated(provider.id, auditContext, {
         provider: input.provider,
         name: input.name,
       });

       const configuredModels = provider.models.map((dbModel) => {
         const runtimeModel = models.find((m) => m.id === dbModel.modelKey);

         return {
           id: dbModel.id,
           modelKey: dbModel.modelKey,
           name: runtimeModel?.name || dbModel.displayName || dbModel.modelKey,
           description: runtimeModel?.description || dbModel.description || undefined,
           contextWindow: runtimeModel?.contextWindow,
           maxOutputTokens: runtimeModel?.maxOutputTokens,
         };
       });

       return {
         id: provider.id,
         name: provider.name,
         provider: provider.provider.toLowerCase(),
         keyPreview,
         models: configuredModels,
         isActive: provider.isActive,
         createdAt: provider.createdAt,
       };
    });
  }

  async getUserProvidersWithModels(
    userId: string,
    auditContext?: AuditContext
  ): Promise<ServiceResult<ProviderWithModels[]>> {
    return withServiceError('fetch providers with models', async () => {
      const providers = await apiProviderRepository.findByUserId(userId, true);
      const providersWithModels: ProviderWithModels[] = [];

      for (const provider of providers) {
        if (provider.revokedAt) continue;

        try {
          const apiKey = decryptApiKey(provider.encryptedKey);
          const providerType = provider.provider.toLowerCase();
          const providerInstance = createProvider(providerType, apiKey);

          if (auditContext) {
            await apiKeyAuditService.logKeyDecrypted(provider.id, auditContext, {
              endpoint: 'getUserProvidersWithModels',
              purpose: 'fetch_models',
            });
          }

          const runtimeModels = await providerInstance.fetchModels();

          const configuredModels = provider.models.map((dbModel) => {
            const runtimeModel = runtimeModels.find((m) => m.id === dbModel.modelKey);

            return {
              id: dbModel.id,
              modelKey: dbModel.modelKey,
              name: runtimeModel?.name || dbModel.displayName || dbModel.modelKey,
              description: runtimeModel?.description || dbModel.description || undefined,
              contextWindow: runtimeModel?.contextWindow,
              maxOutputTokens: runtimeModel?.maxOutputTokens,
            };
          });

          const keyPreview = createKeyPreview(providerType);

          providersWithModels.push({
            id: provider.id,
            name: provider.name,
            provider: providerType,
            isActive: provider.isActive,
            models: configuredModels,
            keyPreview,
            createdAt: provider.createdAt,
            lastUsedAt: provider.lastUsedAt,
          });
        } catch (error) {
          logger.error(`Failed to fetch models for provider ${provider.id}`, error);
           providersWithModels.push({
             id: provider.id,
             name: provider.name,
             provider: provider.provider.toLowerCase(),
             isActive: false,
             models: provider.models.map((dbModel) => ({
               id: dbModel.id,
               modelKey: dbModel.modelKey,
               name: dbModel.displayName || dbModel.modelKey,
               description: dbModel.description || undefined,
             })),
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
        const providerType = p.provider.toLowerCase();
        const keyPreview = this.getStoredKeyPreview(providerType);

        return {
          id: p.id,
          name: p.name,
          provider: providerType,
          providerName: getProviderName(providerType),
          keyPreview,
          models: p.models.map((model) => model.modelKey),
          isActive: p.isActive,
          createdAt: p.createdAt,
          lastUsedAt: p.lastUsedAt,
        };
      });
    });
  }

  async getProviderInstance(
    providerId: string,
    userId: string,
    auditContext?: AuditContext
  ): Promise<ServiceResult<ProviderInstanceData>> {
    return withServiceError('get provider instance', async () => {
      const providerResult = await this.getById(providerId, userId);
      if (isFailure(providerResult)) throw new Error(providerResult.error);
      const provider = providerResult.data;

      if (provider.revokedAt) {
        throw new ValidationError('Provider key has been revoked');
      }

      if (!provider.isActive) {
        throw new ValidationError('Provider is inactive');
      }

      const apiKey = decryptApiKey(provider.encryptedKey);
      const providerType = provider.provider.toLowerCase();
      const providerInstance = createProvider(providerType, apiKey);

      if (auditContext) {
        await apiKeyAuditService.logKeyDecrypted(providerId, auditContext, {
          endpoint: 'getProviderInstance',
          purpose: 'api_call',
        });
      }

      await apiProviderRepository.updateLastUsed(providerId);

      return {
        provider: providerInstance,
        providerType,
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

      const allModels = activeProviders.flatMap((provider) =>
        provider.models.map((model) => ({
          ...model,
          uniqueId: `${provider.id}-${model.id}`,
          providerId: provider.id,
          providerType: provider.provider,
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
      const providerResult = await this.getById(providerId, userId);
      if (isFailure(providerResult)) throw new Error(providerResult.error);
      const provider = providerResult.data;

      const updateData: Record<string, unknown> = {};

      if (input.name !== undefined) {
        updateData.name = input.name;
      }

      if (input.apiKey !== undefined) {
        const providerType = provider.provider.toLowerCase();
        const providerInstance = createProvider(providerType, input.apiKey);

        if (!providerInstance.validateApiKey(input.apiKey)) {
          throw new ValidationError(`Invalid API key format for ${providerInstance.name}`);
        }

        updateData.encryptedKey = encryptApiKey(input.apiKey);
        updateData.keyVersion = (provider.keyVersion || 1) + 1;

        const auditContext = input.auditContext || { userId };
        await apiKeyAuditService.logKeyRotated(providerId, auditContext, {
          keyVersion: updateData.keyVersion as number,
          reason: 'user_initiated',
        });
      }

      if (input.isActive !== undefined) {
        updateData.isActive = input.isActive;
      }

      await this.repository.update(providerId, updateData, userId);

      return { message: 'Provider updated successfully' };
    });
  }

  async deleteProvider(
    providerId: string,
    userId: string,
    auditContext?: AuditContext
  ): Promise<ServiceResult<{ message: string }>> {
    return withServiceError('delete provider', async () => {
      const context = auditContext || { userId };
      await apiKeyAuditService.logKeyDeleted(providerId, context, {
        reason: 'user_initiated',
      });

      await this.delete(providerId, userId);
      return { message: 'Provider deleted successfully' };
    });
  }

  async revokeProvider(
    providerId: string,
    userId: string,
    auditContext?: AuditContext,
    reason?: string
  ): Promise<ServiceResult<{ message: string }>> {
    return withServiceError('revoke provider', async () => {
      const providerResult = await this.getById(providerId, userId);
      if (isFailure(providerResult)) throw new Error(providerResult.error);
      const provider = providerResult.data;

      if (provider.revokedAt) {
        throw new ValidationError('Provider is already revoked');
      }

      await this.repository.update(providerId, {
        revokedAt: new Date(),
        isActive: false,
      }, userId);

      const context = auditContext || { userId };
      await apiKeyAuditService.logKeyRevoked(providerId, context, { reason });

      return { message: 'Provider key revoked successfully' };
    });
  }

  async toggleProvider(
    providerId: string,
    userId: string,
    isActive: boolean
  ): Promise<ServiceResult<{ message: string }>> {
    return withServiceError('toggle provider', async () => {
      const providerResult = await this.getById(providerId, userId);
      const provider = isFailure(providerResult) ? null : providerResult.data;
      
      if (provider?.revokedAt && isActive) {
        throw new ValidationError('Cannot enable a revoked key. Please add a new key.');
      }

      await this.repository.toggleActive(providerId, userId, isActive);
      return { message: `Provider ${isActive ? 'enabled' : 'disabled'} successfully` };
    });
  }

  getSupportedProviders() {
    return getSupportedProviders().map((type) => ({
      id: type,
      name: getProviderName(type),
    }));
  }

  async validateApiKey(
    providerType: string,
    apiKey: string
  ): Promise<ServiceResult<ValidationData>> {
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

  async getFirstActiveProvider(
    userId: string,
    auditContext?: AuditContext
  ): Promise<ServiceResult<{ apiKey: string; providerType: string; providerId: string }>> {
    return withServiceError('get first active provider', async () => {
      const providers = await apiProviderRepository.findByUserId(userId, true);
      const activeProvider = providers.find((p) => p.isActive && !p.revokedAt);

      if (!activeProvider) {
        throw new NotFoundError(
          'No active API provider configured. Please add one in Settings → API Keys'
        );
      }

      const apiKey = decryptApiKey(activeProvider.encryptedKey);
      const providerType = activeProvider.provider.toLowerCase();

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

  async logKeyUsage(
    providerId: string,
    auditContext: AuditContext,
    metadata: { endpoint: string; modelUsed?: string; tokensConsumed?: number; success?: boolean; errorMessage?: string }
  ): Promise<void> {
    await apiKeyAuditService.logKeyUsed(providerId, auditContext, metadata);
  }

  async getProviderAuditLogs(
    providerId: string,
    userId: string,
    options?: { limit?: number; offset?: number }
  ) {
    return apiKeyAuditService.getProviderAuditLogs(providerId, userId, options);
  }

  async getUserAuditLogs(userId: string, options?: { limit?: number; offset?: number }) {
    return apiKeyAuditService.getUserAuditLogs(userId, options);
  }

  private getStoredKeyPreview(providerType: string): string {
    return createKeyPreview(providerType);
  }
}

export const apiProviderService = new ApiProviderService();
