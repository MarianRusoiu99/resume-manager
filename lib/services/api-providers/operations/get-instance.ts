import { apiProviderRepository } from '@/lib/repositories/api-providers.repository';
import { decryptApiKey } from '@/lib/encryption/api-key';
import { apiKeyAuditService, type AuditContext } from '@/lib/services/api-key-management';
import { createProvider } from '@/lib/ai/providers';
import { type ServiceResult } from '@/lib/types';
import { withServiceError, ValidationError } from '@/lib/services/utils';
import { RecordNotFoundError } from '@/lib/errors/database';
import type { ProviderInstanceData } from '../types';

/**
 * Gets a functional provider instance with the decrypted API key
 */
export async function getProviderInstance(
  providerId: string,
  userId: string,
  auditContext?: AuditContext
): Promise<ServiceResult<ProviderInstanceData>> {
  return withServiceError('get provider instance', async () => {
    const provider = await apiProviderRepository.findById(providerId, userId);
    if (!provider) {
      throw new RecordNotFoundError('ApiProvider', providerId, 'getProviderInstance');
    }

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
