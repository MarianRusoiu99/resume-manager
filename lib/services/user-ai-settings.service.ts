/**
 * User AI Settings Service
 * Business logic for managing user AI model preferences per feature
 */

import {
  userAISettingsRepository,
  type AIFeatureType,
  type ModelPreference,
  type UserAISettingsData,
} from '@/lib/repositories/user-ai-settings.repository';
import { apiProviderService, type ProviderWithModels } from './api-provider.service';
import { type ServiceResult } from '@/lib/types/service-result';
import { withServiceError, NotFoundError, ValidationError } from './utils';
import { logger } from '@/lib/utils/logger';

/**
 * Feature configuration with display info
 */
export interface AIFeatureConfig {
  id: AIFeatureType;
  name: string;
  description: string;
  icon?: string;
}

/**
 * All available AI features
 */
export const AI_FEATURES: AIFeatureConfig[] = [
  {
    id: 'resume',
    name: 'Resume Generation',
    description: 'AI model used when generating optimized resumes from job descriptions',
  },
  {
    id: 'coverLetter',
    name: 'Cover Letter Generation',
    description: 'AI model used when generating cover letters',
  },
  {
    id: 'enhance',
    name: 'AI Enhancement',
    description: 'AI model used for enhancing text fields (descriptions, summaries)',
  },
  {
    id: 'template',
    name: 'Template Analysis',
    description: 'AI model used for parsing and analyzing templates',
  },
];

/**
 * Complete model selection for a feature
 */
export interface FeatureModelSelection {
  feature: AIFeatureConfig;
  providerId: string | null;
  providerName: string | null;
  modelId: string | null;
  modelName: string | null;
}

/**
 * All settings with resolved names
 */
export interface ResolvedAISettings {
  features: FeatureModelSelection[];
  availableProviders: ProviderWithModels[];
}

/**
 * Input for updating a feature's model preference
 */
export interface UpdateFeaturePreferenceInput {
  userId: string;
  feature: AIFeatureType;
  providerId: string | null;
  modelId: string | null;
}

class UserAISettingsService {
  /**
   * Get all AI settings for a user with resolved provider/model names
   */
  async getSettings(userId: string): Promise<ServiceResult<ResolvedAISettings>> {
    return withServiceError('get AI settings', async () => {
      // Get user's settings from DB
      const settings = await userAISettingsRepository.findByUserId(userId);
      
      // Get available providers with models
      const providersResult = await apiProviderService.getUserProvidersWithModels(userId);
      const providers = providersResult.success ? providersResult.data : [];

      // Build resolved settings for each feature
      const features: FeatureModelSelection[] = AI_FEATURES.map((feature) => {
        const preference = this.extractPreference(settings, feature.id);
        const resolvedNames = this.resolveNames(preference, providers);

        return {
          feature,
          providerId: preference.providerId,
          providerName: resolvedNames.providerName,
          modelId: preference.modelId,
          modelName: resolvedNames.modelName,
        };
      });

      return {
        features,
        availableProviders: providers,
      };
    });
  }

  /**
   * Update model preference for a specific feature
   */
  async updateFeaturePreference(
    input: UpdateFeaturePreferenceInput
  ): Promise<ServiceResult<FeatureModelSelection>> {
    return withServiceError('update feature preference', async () => {
      const { userId, feature, providerId, modelId } = input;

      // Validate the feature type
      const featureConfig = AI_FEATURES.find((f) => f.id === feature);
      if (!featureConfig) {
        throw new ValidationError(`Invalid feature type: ${feature}`);
      }

      // If clearing the preference, allow null values
      if (!providerId && !modelId) {
        await userAISettingsRepository.updateFeaturePreference(userId, feature, null, null);
        return {
          feature: featureConfig,
          providerId: null,
          providerName: null,
          modelId: null,
          modelName: null,
        };
      }

      // Validate provider exists and belongs to user
      if (providerId) {
        const providersResult = await apiProviderService.getUserProvidersWithModels(userId);
        if (!providersResult.success) {
          throw new ValidationError('Could not fetch providers');
        }

        const provider = providersResult.data.find((p) => p.id === providerId);
        if (!provider) {
          throw new NotFoundError('Provider');
        }

        // Validate model exists in provider
        if (modelId) {
          const modelExists = provider.models.some((m) => m.id === modelId);
          if (!modelExists) {
            throw new ValidationError(`Model ${modelId} not found in provider ${provider.name}`);
          }
        }

        // Save preference
        await userAISettingsRepository.updateFeaturePreference(
          userId,
          feature,
          providerId,
          modelId
        );

        const model = provider.models.find((m) => m.id === modelId);

        return {
          feature: featureConfig,
          providerId,
          providerName: provider.name,
          modelId,
          modelName: model?.name || modelId,
        };
      }

      throw new ValidationError('Provider ID is required when setting a model preference');
    });
  }

  /**
   * Get preference for a specific feature
   * Used by generation services to get the user's preferred model
   */
  async getFeaturePreference(
    userId: string,
    feature: AIFeatureType
  ): Promise<ServiceResult<ModelPreference>> {
    return withServiceError('get feature preference', async () => {
      const preference = await userAISettingsRepository.getFeaturePreference(userId, feature);
      return preference;
    });
  }

  /**
   * Clear all AI settings for a user
   */
  async clearSettings(userId: string): Promise<ServiceResult<void>> {
    return withServiceError('clear AI settings', async () => {
      await userAISettingsRepository.delete(userId);
    });
  }

  /**
   * Resolve provider for a feature, falling back to first available
   * Returns the provider instance and model ID to use
   */
  async resolveProviderForFeature(
    userId: string,
    feature: AIFeatureType,
    overrideModelId?: string
  ): Promise<ServiceResult<{ providerId: string; modelId: string } | null>> {
    return withServiceError('resolve provider for feature', async () => {
      // If override provided, find the provider with that model
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

      // Check user's preference for this feature
      const preference = await userAISettingsRepository.getFeaturePreference(userId, feature);

      if (preference.providerId && preference.modelId) {
        // Validate the preference is still valid (provider exists and is active)
        const providerResult = await apiProviderService.getProviderInstance(
          preference.providerId,
          userId
        );

        if (providerResult.success) {
          return {
            providerId: preference.providerId,
            modelId: preference.modelId,
          };
        }
        
        logger.warn(`User's preferred provider ${preference.providerId} is no longer valid`);
      }

      // Fall back to first available model
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

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private extractPreference(
    settings: UserAISettingsData | null,
    feature: AIFeatureType
  ): ModelPreference {
    if (!settings) {
      return { providerId: null, modelId: null };
    }

    switch (feature) {
      case 'resume':
        return {
          providerId: settings.resumeProviderId,
          modelId: settings.resumeModelId,
        };
      case 'coverLetter':
        return {
          providerId: settings.coverLetterProviderId,
          modelId: settings.coverLetterModelId,
        };
      case 'enhance':
        return {
          providerId: settings.enhanceProviderId,
          modelId: settings.enhanceModelId,
        };
      case 'template':
        return {
          providerId: settings.templateProviderId,
          modelId: settings.templateModelId,
        };
      default:
        return { providerId: null, modelId: null };
    }
  }

  private resolveNames(
    preference: ModelPreference,
    providers: ProviderWithModels[]
  ): { providerName: string | null; modelName: string | null } {
    if (!preference.providerId) {
      return { providerName: null, modelName: null };
    }

    const provider = providers.find((p) => p.id === preference.providerId);
    if (!provider) {
      return { providerName: null, modelName: null };
    }

    const model = provider.models.find((m) => m.id === preference.modelId);

    return {
      providerName: provider.name,
      modelName: model?.name || preference.modelId,
    };
  }
}

export const userAISettingsService = new UserAISettingsService();
