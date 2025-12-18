import { apiProviderService } from '@/lib/services/api-provider';
import { userAISettingsService } from '@/lib/services/user-ai-settings';
import { logger } from '@/lib/utils/logger';
import { failure, success, type ServiceResult } from '@/lib/types/service-result';
import { AIProviderNotConfiguredError, ModelNotFoundError } from '@/lib/errors/ai';

import type { ResolvedAIModel, ResolveAIModelInput } from './types';

function findModel<T extends { id: string; modelKey: string }>(allModels: T[], modelId: string): T | null {
  return (
    allModels.find((m) => m.id === modelId) ??
    allModels.find((m) => m.modelKey === modelId) ??
    allModels.find((m) => m.modelKey.toLowerCase() === modelId.toLowerCase()) ??
    null
  );
}

export async function resolveAIModel(input: ResolveAIModelInput): Promise<ServiceResult<ResolvedAIModel>> {
  try {
    const modelsResult = await apiProviderService.getAvailableModels(input.userId);
    if (!modelsResult.success || modelsResult.data.allModels.length === 0) {
      return failure(
        'No AI provider configured. Please add an API key in Settings → API Keys',
        'NOT_FOUND'
      );
    }

    const { allModels } = modelsResult.data;

    let targetModel: (typeof allModels)[number] | null = null;

    if (input.modelId) {
      targetModel = findModel(allModels, input.modelId);
      if (!targetModel) {
        return failure(`Model ${input.modelId} not found in your configured providers`, 'NOT_FOUND');
      }
    }

    if (!targetModel) {
      const preferenceResult = await userAISettingsService.resolveProviderForFeature(
        input.userId,
        input.feature,
        undefined
      );

      if (preferenceResult.success && preferenceResult.data) {
        targetModel =
          allModels.find(
            (m) => m.id === preferenceResult.data!.modelId && m.providerId === preferenceResult.data!.providerId
          ) ?? null;

        if (targetModel) {
          logger.info(`Using user preference for ${input.feature}`, { modelId: targetModel.id });
        } else {
          logger.warn(`Preferred model for ${input.feature} is no longer available`, {
            userId: input.userId,
            feature: input.feature,
            providerId: preferenceResult.data.providerId,
            modelId: preferenceResult.data.modelId,
          });
        }
      }
    }

    if (!targetModel) {
      targetModel = allModels[0];
      logger.info(`Using default model for ${input.feature}`, { modelId: targetModel.id });
    }

    const providerResult = await apiProviderService.getProviderInstance(targetModel.providerId, input.userId);
    if (!providerResult.success) {
      return failure(providerResult.error || 'Failed to get AI provider configuration', 'INTERNAL_ERROR');
    }

    return success({
      provider: providerResult.data.provider,
      providerId: targetModel.providerId,
      providerType: providerResult.data.providerType,
      modelId: targetModel.id,
      modelKey: targetModel.modelKey,
      feature: input.feature,
    });
  } catch (error) {
    return failure(error instanceof Error ? error.message : 'Failed to resolve AI model', 'INTERNAL_ERROR');
  }
}

export async function resolveAIModelOrThrow(input: ResolveAIModelInput): Promise<ResolvedAIModel> {
  const modelsResult = await apiProviderService.getAvailableModels(input.userId);
  if (!modelsResult.success || modelsResult.data.allModels.length === 0) {
    throw new AIProviderNotConfiguredError();
  }

  const { allModels } = modelsResult.data;

  let targetModel: (typeof allModels)[number] | null = null;

  if (input.modelId) {
    targetModel = findModel(allModels, input.modelId);
    if (!targetModel) {
      throw new ModelNotFoundError(input.modelId);
    }
  }

  if (!targetModel) {
    const preferenceResult = await userAISettingsService.resolveProviderForFeature(input.userId, input.feature);
    if (preferenceResult.success && preferenceResult.data) {
      targetModel =
        allModels.find(
          (m) => m.id === preferenceResult.data!.modelId && m.providerId === preferenceResult.data!.providerId
        ) ?? null;

      if (!targetModel) {
        logger.warn(`User preference for ${input.feature} no longer valid`, {
          userId: input.userId,
          feature: input.feature,
          providerId: preferenceResult.data.providerId,
          modelId: preferenceResult.data.modelId,
        });
      }
    }
  }

  if (!targetModel) {
    targetModel = allModels[0];
  }

  const providerResult = await apiProviderService.getProviderInstance(targetModel.providerId, input.userId);
  if (!providerResult.success) {
    throw new AIProviderNotConfiguredError();
  }

  return {
    provider: providerResult.data.provider,
    providerId: targetModel.providerId,
    providerType: providerResult.data.providerType,
    modelId: targetModel.id,
    modelKey: targetModel.modelKey,
    feature: input.feature,
  };
}
