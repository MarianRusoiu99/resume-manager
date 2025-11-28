/**
 * Base Provider Interface
 * Abstract interface for all AI providers
 */

import type { LanguageModel } from 'ai';

/**
 * Model information returned from provider APIs
 */
export interface AIModel {
  id: string;
  name: string;
  description?: string;
  contextWindow?: number;
  maxOutputTokens?: number;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  type: string;
  name: string;
  apiKey: string;
}

/**
 * Base AI Provider Interface
 * All providers must implement this interface
 */
export interface AIProvider {
  /**
   * Provider type identifier (e.g., 'openai', 'anthropic')
   */
  readonly type: string;

  /**
   * Provider display name (e.g., 'OpenAI', 'Anthropic')
   */
  readonly name: string;

  /**
   * Validate API key format
   */
  validateApiKey(apiKey: string): boolean;

  /**
   * Fetch available models from the provider's API
   * @returns Array of available models
   */
  fetchModels(): Promise<AIModel[]>;

  /**
   * Create a language model instance for use with Vercel AI SDK
   * @param modelId - The model ID to use
   */
  createLanguageModel(modelId: string): LanguageModel;

  /**
   * Get API key prefix pattern for display (e.g., 'sk-', 'sk-ant-')
   */
  getKeyPreview(apiKey: string): string;
}

/**
 * Base implementation with common functionality
 */
export abstract class BaseAIProvider implements AIProvider {
  protected apiKey: string;

  constructor(protected config: ProviderConfig) {
    this.apiKey = config.apiKey;
  }

  abstract readonly type: string;
  abstract readonly name: string;

  abstract validateApiKey(apiKey: string): boolean;
  abstract fetchModels(): Promise<AIModel[]>;
  abstract createLanguageModel(modelId: string): LanguageModel;

  /**
   * Default implementation: show first 12 characters + "..."
   */
  getKeyPreview(apiKey: string): string {
    return apiKey.substring(0, 12) + '...';
  }
}
