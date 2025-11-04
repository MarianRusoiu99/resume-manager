/**
 * Provider Types
 * 
 * Enhanced provider system types with better abstractions
 */

import { z } from 'zod';

/**
 * AI Provider names
 */
export const AI_PROVIDER_NAMES = ['openai', 'anthropic', 'google'] as const;
export type AIProviderName = typeof AI_PROVIDER_NAMES[number];

/**
 * Provider configuration schema
 */
export const ProviderConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional()
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

/**
 * Provider capabilities
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
 * Provider health check result
 */
export interface ProviderHealthCheck {
  healthy: boolean;
  responseTime?: number;
  error?: string;
  timestamp: Date;
}

/**
 * Provider usage statistics
 */
export interface ProviderUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost?: number;
}

/**
 * Message types for provider communication
 */
export type MessageRole = 'system' | 'user' | 'assistant';

export interface ProviderMessage {
  role: MessageRole;
  content: string;
}

/**
 * Completion options
 */
export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

/**
 * Completion response
 */
export interface CompletionResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls';
  usage: ProviderUsage;
  model: string;
}

/**
 * Provider interface
 */
export interface AIProvider {
  readonly name: AIProviderName;
  readonly capabilities: ProviderCapabilities;

  /**
   * Generate completion
   */
  complete(
    messages: ProviderMessage[],
    options?: CompletionOptions
  ): Promise<CompletionResponse>;

  /**
   * Validate provider configuration
   */
  validate(): Promise<boolean>;

  /**
   * Check provider health
   */
  healthCheck(): Promise<ProviderHealthCheck>;

  /**
   * Get current configuration
   */
  getConfig(): ProviderConfig;
}

/**
 * Provider factory interface
 */
export interface ProviderFactory {
  create(provider: AIProviderName, config: ProviderConfig): AIProvider;
  supports(provider: string): provider is AIProviderName;
  getAvailableProviders(): AIProviderName[];
}

/**
 * Type guard for AI provider names
 */
export function isAIProviderName(value: string): value is AIProviderName {
  return AI_PROVIDER_NAMES.includes(value as AIProviderName);
}

/**
 * Validate provider configuration
 */
export function validateProviderConfig(
  config: unknown
): { valid: true; config: ProviderConfig } | { valid: false; errors: string[] } {
  const result = ProviderConfigSchema.safeParse(config);
  
  if (result.success) {
    return { valid: true, config: result.data };
  }
  
  return {
    valid: false,
    errors: result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
  };
}
