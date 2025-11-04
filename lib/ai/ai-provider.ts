/**
 * AI Provider types and constants
 */

export type AIProvider = 'openai' | 'anthropic' | 'google';

export const AI_PROVIDERS = ['openai', 'anthropic', 'google'] as const;

/**
 * Validate if a string is a valid AI provider
 */
export function isValidAIProvider(provider: string): provider is AIProvider {
  return AI_PROVIDERS.includes(provider as AIProvider);
}

/**
 * Get provider display name
 */
export function getProviderDisplayName(provider: AIProvider): string {
  const names: Record<AIProvider, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google AI'
  };
  return names[provider];
}

/**
 * Provider capabilities and configurations
 */
export interface ProviderCapabilities {
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
  maxContextLength: number;
  defaultModel: string;
  availableModels: string[];
}

/**
 * Get capabilities for a specific provider
 */
export function getProviderCapabilities(provider: AIProvider): ProviderCapabilities {
  const capabilities: Record<AIProvider, ProviderCapabilities> = {
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

  return capabilities[provider];
}
