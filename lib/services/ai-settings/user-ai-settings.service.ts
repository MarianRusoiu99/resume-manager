import {
  userAISettingsRepository,
  UserAISettingsRepository,
} from '@/lib/repositories/ai-settings.repository';
import type {
  AIFeatureType,
  ModelPreference,
  UserAISettingsData,
  UpsertAISettingsInput,
} from '@/lib/repositories/interfaces';
import { apiProviderService } from '../api-providers';
import type { ServiceResult } from '@/lib/types/service-result';
import { withServiceError, NotFoundError, ValidationError } from '../utils';
import { AI_FEATURES } from './features';
import type { FeatureModelSelection, ResolvedAISettings, UpdateFeaturePreferenceInput } from './types';
import { extractPreference, resolveNames } from './mappers';
import { resolveProviderForFeature } from './resolver';
import { GenericUserOwnedCrudService } from '../utils/generic-crud.service';

/**
 * User AI Settings Service
 * 
 * Refactored to use GenericUserOwnedCrudService.
 */
export class UserAISettingsService extends GenericUserOwnedCrudService<
  UserAISettingsData,
  UpsertAISettingsInput,
  UpsertAISettingsInput,
  UserAISettingsRepository
> {
  constructor(repository: UserAISettingsRepository = userAISettingsRepository) {
    super(repository, 'User AI Settings');
  }

  async getSettings(userId: string): Promise<ServiceResult<ResolvedAISettings>> {
    return withServiceError('get AI settings', async () => {
      const settings = await this.repository.findByUserId(userId);

      const providersResult = await apiProviderService.getUserProvidersWithModels(userId);
      const providers = providersResult.success ? providersResult.data : [];

      const features: FeatureModelSelection[] = AI_FEATURES.map((feature) => {
        const preference = extractPreference(settings, feature.id);
        const resolved = resolveNames(preference, providers);

        return {
          feature,
          providerId: preference.providerId,
          providerName: resolved.providerName,
          modelId: preference.modelId,
          modelName: resolved.modelName,
        };
      });

      return {
        features,
        availableProviders: providers,
      };
    });
  }

  async updateFeaturePreference(
    input: UpdateFeaturePreferenceInput
  ): Promise<ServiceResult<FeatureModelSelection>> {
    return withServiceError('update feature preference', async () => {
      const { userId, feature, providerId, modelId } = input;

      const featureConfig = AI_FEATURES.find((f) => f.id === feature);
      if (!featureConfig) {
        throw new ValidationError(`Invalid feature type: ${feature}`);
      }

      if (!providerId && !modelId) {
        await this.repository.updateFeaturePreference(userId, feature, null, null);
        return {
          feature: featureConfig,
          providerId: null,
          providerName: null,
          modelId: null,
          modelName: null,
        };
      }

      if (!providerId) {
        throw new ValidationError('Provider ID is required when setting a model preference');
      }

      const providersResult = await apiProviderService.getUserProvidersWithModels(userId);
      if (!providersResult.success) {
        throw new ValidationError('Could not fetch providers');
      }

      const provider = providersResult.data.find((p) => p.id === providerId);
      if (!provider) {
        throw new NotFoundError('Provider');
      }

      let normalizedModelId = modelId;

      if (modelId) {
        const model = provider.models.find((m) => {
          if (m.id === modelId) return true;
          if (m.modelKey === modelId) return true;
          return m.modelKey.toLowerCase() === modelId.toLowerCase();
        });

        if (!model) {
          throw new ValidationError(`Model ${modelId} not found in provider ${provider.name}`);
        }

        normalizedModelId = model.id;
      }

      await this.repository.updateFeaturePreference(userId, feature, providerId, normalizedModelId);

      const savedModel = provider.models.find((m) => m.id === normalizedModelId);

      return {
        feature: featureConfig,
        providerId,
        providerName: provider.name,
        modelId: normalizedModelId,
        modelName: savedModel?.name || normalizedModelId,
      };
    });
  }

  async getFeaturePreference(userId: string, feature: AIFeatureType): Promise<ServiceResult<ModelPreference>> {
    return withServiceError('get feature preference', async () => {
      const preference = await this.repository.getFeaturePreference(userId, feature);
      return preference;
    });
  }

  async updateAllPreferences(
    userId: string,
    input: UpsertAISettingsInput
  ): Promise<ServiceResult<ResolvedAISettings>> {
    return withServiceError('update all AI preferences', async () => {
      await this.repository.upsert({ ...input, userId });
      const result = await this.getSettings(userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    });
  }

  async clearSettings(userId: string): Promise<ServiceResult<void>> {
    return withServiceError('clear AI settings', async () => {
      await this.repository.delete(userId);
    });
  }

  async resolveProviderForFeature(
    userId: string,
    feature: AIFeatureType,
    overrideModelId?: string
  ): Promise<ServiceResult<{ providerId: string; modelId: string } | null>> {
    return withServiceError('resolve provider for feature', async () => {
      return resolveProviderForFeature(userId, feature, overrideModelId);
    });
  }
}

export const userAISettingsService = new UserAISettingsService();
