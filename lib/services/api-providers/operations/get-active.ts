import { apiProviderRepository } from '@/lib/repositories/api-providers.repository';
import { decryptApiKey } from '@/lib/encryption/api-key';
import { apiKeyAuditService, type AuditContext } from '@/lib/services/api-key-management';
import { type ServiceResult } from '@/lib/types';
import { withServiceError, NotFoundError } from '@/lib/services/utils';

/**
 * Gets the first active API provider for a user
 */
export async function getFirstActiveProvider(
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
