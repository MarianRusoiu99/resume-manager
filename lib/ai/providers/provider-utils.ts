/**
 * Enhanced Provider Utilities
 * 
 * High-level utilities for working with AI providers
 */

import type {
  AIProvider,
  AIProviderName,
  ProviderConfig,
  ProviderHealthCheck
} from '../types/provider-types';
import { getModelConfig, type AgentType } from '../config/models';
import { createProvider, ProviderFactory } from './factory';

/**
 * Get an AI provider for a user
 * 
 * @param userId - User ID (for logging/monitoring)
 * @param providerName - Name of the provider to use
 * @param agentType - Type of agent (for config selection)
 * @param apiKey - API key (defaults to env variable)
 * @returns Provider instance or null
 */
export async function getProviderForUser(
  userId: string,
  providerName: AIProviderName = 'openai',
  agentType?: AgentType,
  apiKey?: string
): Promise<AIProvider | null> {
  try {
    // Get API key from environment if not provided
    const key = apiKey || process.env.OPENAI_API_KEY;

    if (!key) {
      console.error(`[getProviderForUser] No API key found for user ${userId} and provider ${providerName}`);
      return null;
    }

    // Get model configuration for agent type
    const modelConfig = agentType ? getModelConfig(agentType) : undefined;

    // Create provider configuration
    const config: ProviderConfig = {
      apiKey: key,
      model: modelConfig?.name,
      temperature: modelConfig?.temperature,
      maxTokens: modelConfig?.maxTokens,
      topP: modelConfig?.topP,
      frequencyPenalty: modelConfig?.frequencyPenalty,
      presencePenalty: modelConfig?.presencePenalty
    };

    // Create and return provider
    const provider = createProvider(providerName, config);

    console.log(`[getProviderForUser] Created ${providerName} provider for user ${userId}`);

    return provider;
  } catch (error) {
    console.error('[getProviderForUser] Error:', error);
    return null;
  }
}

/**
 * Test if a provider is working
 */
export async function testProvider(
  providerName: AIProviderName,
  apiKey: string
): Promise<{ valid: boolean; error?: string; responseTime?: number }> {
  const startTime = Date.now();
  
  try {
    const config: ProviderConfig = { apiKey };
    const provider = createProvider(providerName, config);

    const isValid = await provider.validate();
    const responseTime = Date.now() - startTime;

    if (!isValid) {
      return {
        valid: false,
        error: 'Provider validation failed',
        responseTime
      };
    }

    return {
      valid: true,
      responseTime
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Check health of a provider
 */
export async function checkProviderHealth(
  providerName: AIProviderName,
  apiKey: string
): Promise<ProviderHealthCheck> {
  const timestamp = new Date();
  const startTime = Date.now();

  try {
    const config: ProviderConfig = { apiKey };
    const provider = createProvider(providerName, config);

    const health = await provider.healthCheck();

    return {
      ...health,
      timestamp,
      responseTime: health.responseTime || (Date.now() - startTime)
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp,
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Get provider with retry on failure
 */
export async function getProviderWithRetry(
  userId: string,
  providerName: AIProviderName,
  agentType?: AgentType,
  apiKey?: string,
  maxRetries: number = 3
): Promise<AIProvider | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const provider = await getProviderForUser(userId, providerName, agentType, apiKey);

    if (provider) {
      // Validate the provider before returning
      try {
        const isValid = await provider.validate();
        if (isValid) {
          return provider;
        }
        console.warn(`[getProviderWithRetry] Provider validation failed on attempt ${attempt}`);
      } catch (error) {
        console.warn(`[getProviderWithRetry] Validation error on attempt ${attempt}:`, error);
      }
    }

    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      console.log(`[getProviderWithRetry] Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error(`[getProviderWithRetry] Failed to get provider after ${maxRetries} attempts`);
  return null;
}

/**
 * Clear provider cache
 */
export function clearProviderCache(): void {
  ProviderFactory.clearCache();
}

/**
 * Get provider cache statistics
 */
export function getProviderCacheStats(): { size: number; providers: string[] } {
  return ProviderFactory.getCacheStats();
}

/**
 * Get available providers
 */
export function getAvailableProviders(): AIProviderName[] {
  return ProviderFactory.getAvailableProviders();
}
