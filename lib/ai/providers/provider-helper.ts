/**
 * AI Provider Helper
 * Helper function to get configured AI providers with decrypted API keys
 */

import { apiProviderService } from '@/lib/services/api-provider.service';
import type { AIProvider } from '@/lib/ai/providers';

export interface AIProviderConfig {
  provider: AIProvider;
  model: string;
  providerType: string;
}

/**
 * Get configured AI provider for a specific model
 * @param userId - User ID to fetch API keys for
 * @param modelId - The model ID to use
 * @param providerId - Optional specific provider ID to use
 */
export async function getAIProvider(
  userId: string,
  modelId: string,
  providerId?: string
): Promise<AIProviderConfig> {
  // If provider ID is specified, get that specific provider
  if (providerId) {
    const result = await apiProviderService.getProviderInstance(providerId, userId);
    
    if (!result.success) {
      throw new Error(result.error);
    }

    const { provider, providerType } = result.data;

    return {
      provider,
      model: modelId,
      providerType,
    };
  }

  // Otherwise, find a provider that supports this model
  const modelsResult = await apiProviderService.getAvailableModels(userId);
  
  if (!modelsResult.success) {
    throw new Error('No API providers configured. Please add one in Settings → API Keys');
  }

  // Find which provider has this model
  const modelInfo = modelsResult.data.allModels.find((m) => m.id === modelId);
  
  if (!modelInfo) {
    throw new Error(`Model ${modelId} not found in your configured providers`);
  }

  // Get the provider instance
  const providerResult = await apiProviderService.getProviderInstance(
    modelInfo.providerId,
    userId
  );

  if (!providerResult.success) {
    throw new Error(providerResult.error);
  }

  const { provider, providerType } = providerResult.data;

  return {
    provider,
    model: modelId,
    providerType,
  };
}

/**
 * Get default model for a user (first available model)
 */
export async function getDefaultModel(userId: string): Promise<string | null> {
  const modelsResult = await apiProviderService.getAvailableModels(userId);

  if (!modelsResult.success || modelsResult.data.allModels.length === 0) {
    return null;
  }

  // Return the first available model
  return modelsResult.data.allModels[0].id;
}
