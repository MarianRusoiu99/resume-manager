import type { AIFeatureType } from '@/lib/repositories/interfaces';
import { userAISettingsRepository } from '@/lib/repositories/user-ai-settings.repository';
import { apiProviderService } from '../api-provider';
import { withServiceError } from '../utils';
import { logger } from '@/lib/utils/logger';

/**
 * Resolves a usable `(providerId, modelId)` tuple for AI operations.
 *
 * Order:
 * 1) `overrideModelId` (if valid)
 * 2) saved user preference (if valid)
 * 3) first available active model
 */
export async function resolveProviderForFeature(
  userId: string,
  feature: AIFeatureType,
  overrideModelId?: string
) {
  return withServiceError('resolve provider for feature', async () => {
    if (overrideModelId) {
      const modelsResult = await apiProviderService.getAvailableModels(userId);
      if (modelsResult.success) {
        const model = modelsResult.data.allModels.find((m) => m.id === overrideModelId);
        if (model) {
          return { providerId: model.providerId, modelId: overrideModelId };
        }
      }
      logger.warn(`Override model ${overrideModelId} not found, falling back to preference`);
    }

    const preference = await userAISettingsRepository.getFeaturePreference(userId, feature);

    if (preference.providerId && preference.modelId) {
      const providerResult = await apiProviderService.getProviderInstance(preference.providerId, userId);

      if (providerResult.success) {
        const modelsResult = await apiProviderService.getAvailableModels(userId);
        if (modelsResult.success) {
          const preferredModel = modelsResult.data.allModels.find((m) => {
            if (m.providerId !== preference.providerId) return false;
            if (m.id === preference.modelId) return true;
            if (m.modelKey === preference.modelId) return true;
            return m.modelKey.toLowerCase() === preference.modelId!.toLowerCase();
          });

          if (preferredModel) {
            return {
              providerId: preference.providerId,
              modelId: preferredModel.id,
            };
          }
        }

        logger.warn(`User's preferred model ${preference.modelId} is no longer valid`);
      }

      logger.warn(`User's preferred provider ${preference.providerId} is no longer valid`);
    }

    const modelsResult = await apiProviderService.getAvailableModels(userId);
    if (!modelsResult.success || modelsResult.data.allModels.length === 0) {
      return null;
    }

    const firstModel = modelsResult.data.allModels[0];
    return {
      providerId: firstModel.providerId,
      modelId: firstModel.id,
    };
  });
}
