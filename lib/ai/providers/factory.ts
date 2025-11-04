/**
 * Provider Factory
 * 
 * Factory pattern for creating AI provider instances
 */

import type {
  AIProvider,
  AIProviderName,
  ProviderConfig,
  ProviderFactory as IProviderFactory
} from '../types/provider-types';
import { isAIProviderName, validateProviderConfig } from '../types/provider-types';
import { OpenAIProvider } from './openai';

/**
 * Provider factory implementation
 */
class ProviderFactoryImpl implements IProviderFactory {
  private static instance: ProviderFactoryImpl;
  private providers: Map<string, AIProvider> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ProviderFactoryImpl {
    if (!ProviderFactoryImpl.instance) {
      ProviderFactoryImpl.instance = new ProviderFactoryImpl();
    }
    return ProviderFactoryImpl.instance;
  }

  /**
   * Create a new provider instance
   */
  create(providerName: AIProviderName, config: ProviderConfig): AIProvider {
    // Validate configuration
    const validation = validateProviderConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid provider configuration: ${validation.errors.join(', ')}`);
    }

    // Create cache key
    const cacheKey = this.getCacheKey(providerName, config.apiKey);

    // Return cached instance if exists
    if (this.providers.has(cacheKey)) {
      return this.providers.get(cacheKey)!;
    }

    // Create new provider instance
    let provider: AIProvider;

    switch (providerName) {
      case 'openai':
        provider = new OpenAIProvider(config);
        break;

      case 'anthropic':
        throw new Error('Anthropic provider not yet implemented');

      case 'google':
        throw new Error('Google AI provider not yet implemented');

      default:
        throw new Error(`Unsupported provider: ${providerName}`);
    }

    // Cache the instance
    this.providers.set(cacheKey, provider);

    return provider;
  }

  /**
   * Check if a provider is supported
   */
  supports(provider: string): provider is AIProviderName {
    return isAIProviderName(provider);
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): AIProviderName[] {
    return ['openai', 'anthropic', 'google'];
  }

  /**
   * Get a cached provider instance
   */
  getCached(providerName: AIProviderName, apiKey: string): AIProvider | undefined {
    const cacheKey = this.getCacheKey(providerName, apiKey);
    return this.providers.get(cacheKey);
  }

  /**
   * Clear all cached providers
   */
  clearCache(): void {
    this.providers.clear();
  }

  /**
   * Remove a specific provider from cache
   */
  remove(providerName: AIProviderName, apiKey: string): boolean {
    const cacheKey = this.getCacheKey(providerName, apiKey);
    return this.providers.delete(cacheKey);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; providers: string[] } {
    return {
      size: this.providers.size,
      providers: Array.from(this.providers.keys())
    };
  }

  /**
   * Generate cache key from provider name and API key
   */
  private getCacheKey(providerName: AIProviderName, apiKey: string): string {
    // Use first 8 characters of API key for cache key (for privacy)
    const keyPrefix = apiKey.substring(0, 8);
    return `${providerName}-${keyPrefix}`;
  }
}

/**
 * Export singleton instance
 */
export const ProviderFactory = ProviderFactoryImpl.getInstance();

/**
 * Convenience function to create a provider
 */
export function createProvider(
  providerName: AIProviderName,
  config: ProviderConfig
): AIProvider {
  return ProviderFactory.create(providerName, config);
}

/**
 * Convenience function to check provider support
 */
export function isProviderSupported(provider: string): provider is AIProviderName {
  return ProviderFactory.supports(provider);
}
