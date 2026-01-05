import { apiProviderRepository } from '@/lib/repositories/api-providers.repository';
import { encryptApiKey, createKeyPreview } from '@/lib/encryption/api-key';
import { apiKeyAuditService } from '../../api-key-management';
import {
  createProvider,
  getSupportedProviders,
  isProviderSupported,
} from '@/lib/ai/providers';
import { type ServiceResult } from '@/lib/types/service-result';
import {
  withServiceError,
  ValidationError,
  UnauthorizedError,
  ExternalServiceError,
} from '@/lib/services/utils';
import type { AIModel } from '@/lib/ai/providers';
import type { AddApiProviderInput, ProviderInfo } from '../types';

/**
 * Handles adding a new API provider
 */
export async function addProvider(input: AddApiProviderInput): Promise<ServiceResult<ProviderInfo>> {
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
