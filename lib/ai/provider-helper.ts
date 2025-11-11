/**
 * AI Provider Helper
 * Helper function to get configured AI providers with decrypted API keys
 */

import { createOpenAI } from '@ai-sdk/openai';
import { apiProviderService } from '@/lib/services/api-provider.service';

export interface AIProviderConfig {
  provider: ReturnType<typeof createOpenAI>; // The configured AI SDK provider
  model: string;
  providerType: string;
}

/**
 * Get configured AI provider for a specific model
 * @param userId - User ID to fetch API keys for
 * @param modelId - The model ID to use (e.g., 'gpt-4', 'claude-3-opus-20240229')
 * @param providerId - Optional specific provider ID to use
 */
export async function getAIProvider(
  userId: string,
  modelId: string,
  providerId?: string
): Promise<AIProviderConfig> {
  // If provider ID is specified, get that specific provider
  if (providerId) {
    const result = await apiProviderService.getDecryptedKey(providerId, userId);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get API key');
    }

    const { apiKey, provider: providerType } = result.data;

    // Create the appropriate provider
    return createProviderInstance(providerType, apiKey, modelId);
  }

  // Otherwise, find a provider that supports this model
  const modelsResult = await apiProviderService.getAvailableModels(userId);
  
  if (!modelsResult.success || !modelsResult.data) {
    throw new Error('No API providers configured. Please add one in Settings → API Keys');
  }

  // Find which provider has this model
  const modelInfo = modelsResult.data.allModels.find((m) => m.id === modelId);
  
  if (!modelInfo) {
    throw new Error(`Model ${modelId} not found in your configured providers`);
  }

  // Get the decrypted key for this provider
  const keyResult = await apiProviderService.getDecryptedKey(
    modelInfo.providerId,
    userId
  );

  if (!keyResult.success || !keyResult.data) {
    throw new Error(keyResult.error || 'Failed to get API key');
  }

  const { apiKey, provider: providerType } = keyResult.data;

  return createProviderInstance(providerType, apiKey, modelId);
}

/**
 * Create provider instance based on provider type
 */
function createProviderInstance(
  providerType: string,
  apiKey: string,
  modelId: string
): AIProviderConfig {
  switch (providerType) {
    case 'openai':
      return {
        provider: createOpenAI({
          apiKey,
        }),
        model: modelId,
        providerType: 'openai',
      };

    case 'anthropic':
    case 'google':
      throw new Error(`Provider ${providerType} not yet implemented. Currently only OpenAI is supported.`);

    default:
      throw new Error(`Unsupported provider type: ${providerType}`);
  }
}

/**
 * Get default model for a user (first available model)
 */
export async function getDefaultModel(userId: string): Promise<string | null> {
  const modelsResult = await apiProviderService.getAvailableModels(userId);
  
  if (!modelsResult.success || !modelsResult.data) {
    return null;
  }

  return modelsResult.data.allModels[0]?.id || null;
}
