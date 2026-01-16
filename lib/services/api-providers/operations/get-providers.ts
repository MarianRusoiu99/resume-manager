import { apiProviderRepository } from '@/lib/repositories/api-providers.repository';
import { decryptApiKey, createKeyPreview } from '@/lib/encryption/api-key';
import { apiKeyAuditService, type AuditContext } from '@/lib/services/api-key-management';
import { createProvider } from '@/lib/ai/providers';
import { type ServiceResult } from '@/lib/types/service-result';
import { withServiceError } from '@/lib/services/utils';
import { logger } from '@/lib/utils/logger';
import type { ProviderWithModels } from '../types';

/**
 * Fetches user providers and their available models from the remote API
 */
export async function getUserProvidersWithModels(
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

          if (!apiKey) {
            throw new Error(`Decrypted key for provider ${provider.id} is empty`);
          }

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
