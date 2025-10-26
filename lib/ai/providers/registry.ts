import { AIProvider, AIProviderConfig } from './base';
import { OpenAIProvider } from './openai';

export type ProviderType = 'openai' | 'anthropic' | 'google';

/**
 * Registry for managing AI provider instances
 */
export class AIProviderRegistry {
  private static providers: Map<string, AIProvider> = new Map();

  /**
   * Create and register a provider instance
   */
  static createProvider(
    type: ProviderType,
    config: AIProviderConfig
  ): AIProvider {
    const key = `${type}-${config.apiKey.substring(0, 8)}`;

    // Return existing instance if available
    if (this.providers.has(key)) {
      return this.providers.get(key)!;
    }

    // Create new provider instance
    let provider: AIProvider;

    switch (type) {
      case 'openai':
        provider = new OpenAIProvider(config);
        break;

      case 'anthropic':
        // TODO: Implement AnthropicProvider
        throw new Error('Anthropic provider not yet implemented');

      case 'google':
        // TODO: Implement GoogleProvider
        throw new Error('Google provider not yet implemented');

      default:
        throw new Error(`Unknown provider type: ${type}`);
    }

    // Cache the provider instance
    this.providers.set(key, provider);

    return provider;
  }

  /**
   * Get a provider instance (must be created first)
   */
  static getProvider(key: string): AIProvider | undefined {
    return this.providers.get(key);
  }

  /**
   * Clear all cached provider instances
   */
  static clearCache(): void {
    this.providers.clear();
  }

  /**
   * Remove a specific provider from cache
   */
  static removeProvider(key: string): boolean {
    return this.providers.delete(key);
  }

  /**
   * Get list of supported provider types
   */
  static getSupportedProviders(): ProviderType[] {
    return ['openai', 'anthropic', 'google'];
  }

  /**
   * Check if a provider type is supported
   */
  static isSupported(type: string): type is ProviderType {
    return ['openai', 'anthropic', 'google'].includes(type);
  }
}
