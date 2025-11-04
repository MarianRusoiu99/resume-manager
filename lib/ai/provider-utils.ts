import { AIProvider, AIProviderConfig } from './providers/base';
import { AIProviderRegistry, ProviderType } from './providers/registry';
import { AIProvider as AIProviderType } from '@/lib/ai/ai-provider';

/**
 * Get an AI provider instance for a user
 * Retrieves the active API key from the database and creates a provider
 * 
 * In development mode, falls back to process.env.OPENAI_API_KEY if no user key exists
 */
export async function getProviderForUser(
  userId: string,
  providerType: AIProviderType = 'openai',
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<AIProvider | null> {
  try {
    // Get the decrypted API key from the database
    const apiKey = process.env.OPENAI_API_KEY || '';

    // Create provider configuration
    const config: AIProviderConfig = {
      apiKey,
      model: options?.model,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens
    };

    // Create and return the provider instance
    const provider = AIProviderRegistry.createProvider(
      providerType as ProviderType,
      config
    );

    return provider;
  } catch (error) {
    console.error('Error getting provider for user:', error);
    return null;
  }
}


/**
 * Test if a user's API key is valid by making a test call
 */
export async function testUserProvider(
  userId: string,
  providerType: AIProviderType = 'openai'
): Promise<{ valid: boolean; error?: string }> {
  try {
    const provider = await getProviderForUser(userId, providerType);

    if (!provider) {
      return {
        valid: false,
        error: `No active API key found for ${providerType}`
      };
    }

    const isValid = await provider.validate();

    return {
      valid: isValid,
      error: isValid ? undefined : 'API key validation failed'
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Re-export getProviderCapabilities from ai-provider types
export { getProviderCapabilities } from '@/lib/ai/ai-provider';
