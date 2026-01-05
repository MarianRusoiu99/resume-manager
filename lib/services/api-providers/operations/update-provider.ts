import { apiProviderRepository } from '@/lib/repositories/api-providers.repository';
import { encryptApiKey } from '@/lib/encryption/api-key';
import { apiKeyAuditService} from '../../api-key-management';
import { createProvider } from '@/lib/ai/providers';
import { type ServiceResult } from '@/lib/types/service-result';
import { withServiceError, ValidationError } from '@/lib/services/utils';
import { RecordNotFoundError } from '@/lib/errors/database';
import type { UpdateApiProviderInput } from '../types';

/**
 * Updates an existing API provider
 */
export async function updateProvider(
  providerId: string,
  userId: string,
  input: UpdateApiProviderInput
): Promise<ServiceResult<{ message: string }>> {
  return withServiceError('update provider', async () => {
    // We need to fetch the existing provider to get its type if rotated
    const provider = await apiProviderRepository.findById(providerId, userId);
    if (!provider) {
      throw new RecordNotFoundError('ApiProvider', providerId, 'updateProvider');
    }

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

    await apiProviderRepository.update(providerId, updateData, userId);

    return { message: 'Provider updated successfully' };
  });
}

/**
 * Toggles a provider's active status
 */
export async function toggleProvider(
  providerId: string,
  userId: string,
  isActive: boolean
): Promise<ServiceResult<{ message: string }>> {
  return withServiceError('toggle provider', async () => {
    const provider = await apiProviderRepository.findById(providerId, userId);
    
    if (provider?.revokedAt && isActive) {
      throw new ValidationError('Cannot enable a revoked key. Please add a new key.');
    }

    await apiProviderRepository.toggleActive(providerId, userId, isActive);
    return { message: `Provider ${isActive ? 'enabled' : 'disabled'} successfully` };
  });
}
