// Base interfaces and types
export type {
  AIProvider,
  AIProviderConfig,
  AIProviderCapabilities,
  AIMessage,
  AICompletionResponse,
  AICompletionOptions
} from './providers/base';

// Provider implementations
export { OpenAIProvider } from './providers/openai';

// Provider registry
export { AIProviderRegistry, type ProviderType } from './providers/registry';

// Utility functions
export {
  getProviderForUser,
  testUserProvider,
  getProviderCapabilities
} from './provider-utils';
