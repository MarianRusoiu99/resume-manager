/**
 * Provider Factory
 * Creates AI provider instances based on provider type
 * 
 * IMPORTANT: Only providers with complete implementations are included.
 * Placeholder providers (Anthropic, Google) are NOT exposed until implemented.
 * 
 * To add a new provider:
 * 1. Create the provider class extending BaseAIProvider
 * 2. Implement all required methods (constructor must NOT throw)
 * 3. Add to PROVIDER_REGISTRY below
 * 4. Update lib/validations/settings.ts SUPPORTED_PROVIDERS
 */

import type { AIProvider, ProviderConfig } from './base';
import { OpenAIProvider } from './openai';
import { UnsupportedProviderError } from '@/lib/errors/ai';

/**
 * Supported provider types
 * Only include providers that have working implementations
 */
export const SUPPORTED_PROVIDERS = ['openai'] as const;
export type SupportedProvider = typeof SUPPORTED_PROVIDERS[number];

/**
 * Provider registry - maps provider type to implementation class
 * Only providers with complete implementations should be added here
 */
const PROVIDER_REGISTRY: Record<SupportedProvider, new (config: ProviderConfig) => AIProvider> = {
  openai: OpenAIProvider,
  // Add more providers here as they are implemented:
  // anthropic: AnthropicProvider,
  // google: GoogleProvider,
};

/**
 * Provider display names
 */
const PROVIDER_NAMES: Record<SupportedProvider, string> = {
  openai: 'OpenAI',
  // anthropic: 'Anthropic',
  // google: 'Google AI',
};

/**
 * Create an AI provider instance
 * 
 * @param providerType - The type of provider to create
 * @param apiKey - The API key for the provider
 * @returns An instance of AIProvider
 * @throws UnsupportedProviderError if provider type is not supported
 * 
 * @example
 * ```typescript
 * const provider = createProvider('openai', 'sk-...');
 * const model = provider.createLanguageModel('gpt-4o');
 * ```
 */
export function createProvider(providerType: string, apiKey: string): AIProvider {
  const normalizedType = providerType.toLowerCase() as SupportedProvider;
  const ProviderClass = PROVIDER_REGISTRY[normalizedType];

  if (!ProviderClass) {
    throw new UnsupportedProviderError(providerType, [...SUPPORTED_PROVIDERS]);
  }

  const config: ProviderConfig = {
    type: normalizedType,
    name: PROVIDER_NAMES[normalizedType] || providerType,
    apiKey,
  };

  return new ProviderClass(config);
}

/**
 * Get all supported provider types
 */
export function getSupportedProviders(): readonly SupportedProvider[] {
  return SUPPORTED_PROVIDERS;
}

/**
 * Check if a provider type is supported
 */
export function isProviderSupported(providerType: string): providerType is SupportedProvider {
  return SUPPORTED_PROVIDERS.includes(providerType.toLowerCase() as SupportedProvider);
}

/**
 * Get provider display name
 */
export function getProviderName(providerType: string): string {
  const normalizedType = providerType.toLowerCase() as SupportedProvider;
  return PROVIDER_NAMES[normalizedType] || providerType.charAt(0).toUpperCase() + providerType.slice(1);
}

/**
 * Validate that a provider type is supported before use
 * Throws a descriptive error if not supported
 */
export function assertProviderSupported(providerType: string): asserts providerType is SupportedProvider {
  if (!isProviderSupported(providerType)) {
    throw new UnsupportedProviderError(providerType, [...SUPPORTED_PROVIDERS]);
  }
}
