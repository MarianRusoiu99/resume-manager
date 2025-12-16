import { logger } from '@/lib/utils/logger';
import { failure, success, type ServiceResult } from '@/lib/types/service-result';

import type { ResolvedProviderResult } from './types';

export type ResumeGenerationFeature = 'resume' | 'coverLetter' | 'enhance' | 'template';

/**
 * Resolve AI provider and model for generation.
 * Respects user's AI model preferences.
 */
export async function resolveProvider(
  userId: string,
  modelId?: string,
  feature: ResumeGenerationFeature = 'resume'
): Promise<ServiceResult<ResolvedProviderResult>> {
  const { apiProviderService } = await import('@/lib/services/api-provider.service');
  const { userAISettingsService } = await import('@/lib/services/user-ai-settings.service');

  try {
    const modelsResult = await apiProviderService.getAvailableModels(userId);
    if (!modelsResult.success || modelsResult.data.allModels.length === 0) {
      return failure(
        'No AI provider configured. Please add an API key in Settings → API Keys',
        'NOT_FOUND'
      );
    }

    let targetModel = null as (typeof modelsResult.data.allModels)[number] | null;

    if (modelId) {
      targetModel = modelsResult.data.allModels.find((m) => m.id === modelId) ?? null;
      if (!targetModel) {
        return failure(`Model ${modelId} not found in your configured providers`, 'NOT_FOUND');
      }
    }

    if (!targetModel) {
      const preferenceResult = await userAISettingsService.resolveProviderForFeature(userId, feature);
      if (preferenceResult.success && preferenceResult.data) {
        targetModel =
          modelsResult.data.allModels.find(
            (m) =>
              m.id === preferenceResult.data!.modelId &&
              m.providerId === preferenceResult.data!.providerId
          ) ?? null;

        if (targetModel) {
          logger.info(`Using user preference for ${feature}`, { modelId: targetModel.id });
        }
      }
    }

    if (!targetModel) {
      targetModel = modelsResult.data.allModels[0];
      logger.info(`Using default model for ${feature}`, { modelId: targetModel.id });
    }

    const providerResult = await apiProviderService.getProviderInstance(targetModel.providerId, userId);
    if (!providerResult.success) {
      return failure(providerResult.error || 'Failed to get AI provider configuration', 'INTERNAL_ERROR');
    }

    return success({
      provider: providerResult.data.provider,
      modelId: targetModel.id,
      providerType: providerResult.data.providerType,
    });
  } catch (error) {
    return failure(error instanceof Error ? error.message : 'Failed to get AI provider', 'INTERNAL_ERROR');
  }
}
