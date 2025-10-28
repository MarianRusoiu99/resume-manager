import { AIProvider, AIProviderConfig } from './providers/base';
import { AIProviderRegistry, ProviderType } from './providers/registry';
import { apiKeyService, AIProvider as AIProviderType } from '@/lib/services/apikey.service';

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
    let apiKey = await apiKeyService.getDecryptedKey(userId, providerType);

    // Dev mode fallback: use environment variable if no user key exists
    if (!apiKey && process.env.NODE_ENV === 'development') {
      if (providerType === 'openai' && process.env.OPENAI_API_KEY) {
        apiKey = process.env.OPENAI_API_KEY;
        console.log(`🔧 Dev mode: Using OPENAI_API_KEY from environment for user ${userId}`);
      }
    }

    if (!apiKey) {
      console.error(`No active API key found for user ${userId} and provider ${providerType}`);
      return null;
    }

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
 * Validate that a user has an active API key for a provider
 * 
 * In development mode, returns true if process.env.OPENAI_API_KEY is set
 */
export async function hasActiveProvider(
  userId: string,
  providerType: AIProviderType = 'openai'
): Promise<boolean> {
  try {
    const apiKey = await apiKeyService.getDecryptedKey(userId, providerType);
    
    // Check user's API key first
    if (apiKey !== null) {
      return true;
    }
    
    // Dev mode fallback: check environment variable
    if (process.env.NODE_ENV === 'development' && providerType === 'openai') {
      return !!process.env.OPENAI_API_KEY;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking for active provider:', error);
    return false;
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

/**
 * Get provider capabilities for a given provider type
 */
export function getProviderCapabilities(providerType: ProviderType) {
  // This would normally query the provider instance, but we'll return defaults
  const capabilities = {
    openai: {
      supportsStreaming: true,
      supportsVision: true,
      supportsFunctionCalling: true,
      maxContextLength: 128000,
      defaultModel: 'gpt-4-turbo-preview',
      availableModels: [
        'gpt-4-turbo-preview',
        'gpt-4',
        'gpt-3.5-turbo',
        'gpt-3.5-turbo-16k'
      ]
    },
    anthropic: {
      supportsStreaming: true,
      supportsVision: true,
      supportsFunctionCalling: true,
      maxContextLength: 200000,
      defaultModel: 'claude-3-opus-20240229',
      availableModels: [
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307'
      ]
    },
    google: {
      supportsStreaming: true,
      supportsVision: true,
      supportsFunctionCalling: true,
      maxContextLength: 32000,
      defaultModel: 'gemini-pro',
      availableModels: ['gemini-pro', 'gemini-pro-vision']
    }
  };

  return capabilities[providerType];
}
