import type { UserAISettingsData } from '@/lib/repositories/interfaces';
import type { ProviderWithModels } from '../api-providers';
import type { AIFeatureType, ModelPreference } from './types';

export function extractPreference(
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

export function resolveNames(
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

  const model = provider.models.find((m) => {
    if (m.id === preference.modelId) return true;
    if (m.modelKey === preference.modelId) return true;
    if (!preference.modelId) return false;
    return m.modelKey.toLowerCase() === preference.modelId.toLowerCase();
  });

  return {
    providerName: provider.name,
    modelName: model?.name || preference.modelId,
  };
}
