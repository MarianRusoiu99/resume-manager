import { userAISettingsRepository } from '@/lib/repositories/ai-settings.repository';
import { apiProviderService } from '../api-providers';
import { logger } from '@/lib/utils/logger';
import { AIModelFeature } from '@/lib/ai/runtime/types';

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
  feature: AIModelFeature,
  overrideModelId?: string
) {
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

  // NOTE: We deliberately do NOT fallback to the first available model.
  // If the user hasn't explicitly set a preference, or their preference is invalid,
  // we return null. This forces the UI/Application to prompt the user to select a model.
  return null;
}
