/**
 * AI Providers - Main Export
 * 
 * Centralized export for provider system
 */

// Base interfaces
export * from './base';
export type {
  AIProvider,
  AIProviderConfig,
  AIProviderCapabilities,
  AIMessage,
  AICompletionResponse,
  AICompletionOptions
} from './base';

// Provider implementations
export { OpenAIProvider } from './openai';

// Factory and registry
export * from './factory';
export { 
  ProviderFactory,
  createProvider,
  isProviderSupported
} from './factory';

export * from './registry';
export { AIProviderRegistry, type ProviderType } from './registry';

// Provider utilities
export * from './provider-utils';
export {
  getProviderForUser,
  testProvider,
  checkProviderHealth,
  getProviderWithRetry,
  clearProviderCache,
  getProviderCacheStats,
  getAvailableProviders
} from './provider-utils';
