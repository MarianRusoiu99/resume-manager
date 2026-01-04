/**
 * API Provider Service
 *
 * Facade for API provider operations.
 */

import { apiProviderRepository, ApiProviderRepository } from '@/lib/repositories/api-providers.repository';
import { createKeyPreview } from '@/lib/encryption/api-key';
import { apiKeyAuditService, type AuditContext } from '../api-key-management';
import {
  getSupportedProviders,
  getProviderName,
  createProvider,
  isProviderSupported,
} from '@/lib/ai/providers';
import { type ServiceResult } from '@/lib/types/service-result';
import { withServiceError, ValidationError } from '@/lib/services/utils';
import { GenericUserOwnedCrudService } from '../utils/generic-crud.service';

import type {
  ProviderListItem,
  AvailableModelsData,
  ValidationData,
} from './types';
import { ApiProviderWithModels, CreateApiProviderInput, UpdateApiProviderInput as RepoUpdateInput } from '@/lib/repositories/interfaces/api-providers.repository.interface';

// Modular operations
import { addProvider } from './operations/add-provider';
import { getUserProvidersWithModels } from './operations/get-providers';
import { getProviderInstance } from './operations/get-instance';
import { getFirstActiveProvider } from './operations/get-active';
import { updateProvider, toggleProvider } from './operations/update-provider';

export class ApiProviderService 
  extends GenericUserOwnedCrudService<ApiProviderWithModels, CreateApiProviderInput, RepoUpdateInput, Record<string, unknown>, ApiProviderRepository>
{
  constructor(repository: ApiProviderRepository = apiProviderRepository) {
    super(repository, 'ApiProvider');
  }

  // Delegate complex operations to specialized modules
  addProvider = addProvider;
  getUserProvidersWithModels = getUserProvidersWithModels;
  getProviderInstance = getProviderInstance;
  getFirstActiveProvider = getFirstActiveProvider;
  updateProvider = updateProvider;
  toggleProvider = toggleProvider;

  async getUserProviders(userId: string): Promise<ServiceResult<ProviderListItem[]>> {
    return withServiceError('fetch user providers', async () => {
      const providers = await apiProviderRepository.findByUserId(userId, true);

      return providers.map((p) => {
        const providerType = p.provider.toLowerCase();
        const keyPreview = createKeyPreview(providerType);

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
      const provider = await this.repository.findById(providerId, userId);
      if (!provider) throw new Error('Provider not found');

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
}

export const apiProviderService = new ApiProviderService();
export type { AddApiProviderInput, UpdateApiProviderInput } from './types';
