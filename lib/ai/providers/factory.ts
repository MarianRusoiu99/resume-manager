/**
 * Provider Factory
 * Creates AI provider instances based on provider type
 */

import type { AIProvider, ProviderConfig } from './base';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GoogleProvider } from './google';

/**
 * Supported provider types
 */
export type SupportedProvider = 'openai' | 'anthropic' | 'google';

/**
 * Provider registry
 */
const providerRegistry: Record<SupportedProvider, new (config: ProviderConfig) => AIProvider> = {
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
  google: GoogleProvider,
};

/**
 * Create an AI provider instance
 * @param providerType - The type of provider to create
 * @param apiKey - The API key for the provider
 * @returns An instance of AIProvider
 * @throws Error if provider type is not supported
 */
export function createProvider(providerType: string, apiKey: string): AIProvider {
  const ProviderClass = providerRegistry[providerType as SupportedProvider];

  if (!ProviderClass) {
    throw new Error(
      `Unsupported provider: ${providerType}. Supported providers: ${Object.keys(providerRegistry).join(', ')}`
    );
  }

  const config: ProviderConfig = {
    type: providerType,
    name: providerType.charAt(0).toUpperCase() + providerType.slice(1),
    apiKey,
  };

  return new ProviderClass(config);
}

/**
 * Get all supported provider types
 */
export function getSupportedProviders(): SupportedProvider[] {
  return Object.keys(providerRegistry) as SupportedProvider[];
}

/**
 * Check if a provider type is supported
 */
export function isProviderSupported(providerType: string): providerType is SupportedProvider {
  return providerType in providerRegistry;
}

/**
 * Get provider display name
 */
export function getProviderName(providerType: string): string {
  const names: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google AI',
  };
  return names[providerType] || providerType.charAt(0).toUpperCase() + providerType.slice(1);
}
