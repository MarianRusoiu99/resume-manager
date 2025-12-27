/**
 * Anthropic Provider Implementation
 * Note: Anthropic support requires @ai-sdk/anthropic package
 */

import type { LanguageModel } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { BaseAIProvider, type AIModel, type ProviderConfig } from './base';
import { logger } from '@/lib/utils/logger';

interface AnthropicModelResponse {
  data: Array<{
    id: string;
    display_name: string;
    created_at: string;
    type: string;
  }>;
  first_id?: string;
  has_more: boolean;
  last_id?: string;
}

/**
 * Anthropic Provider
 */
export class AnthropicProvider extends BaseAIProvider {
  readonly type = 'anthropic';
  readonly name = 'Anthropic';

  private readonly anthropic: ReturnType<typeof createAnthropic>;

  constructor(config: ProviderConfig) {
    super(config);
    this.anthropic = createAnthropic({ apiKey: config.apiKey });
  }

  /**
   * Validate Anthropic API key format
   * Format: sk-ant-<95+ alphanumeric chars>
   */
  validateApiKey(apiKey: string): boolean {
    return /^sk-ant-[a-zA-Z0-9-_]{95,}$/.test(apiKey);
  }

  /**
   * Fetch available models from Anthropic API
   */
  async fetchModels(): Promise<AIModel[]> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as AnthropicModelResponse;

      // Map models and sort by version (newest first)
      const models = data.data
        .filter((model) => model.type === 'model')
        .map((model) => this.mapAnthropicModel(model))
        .sort((a, b) => {
          // Sort by ID descending (newer models have later dates in ID)
          return b.id.localeCompare(a.id);
        });

      return models;
    } catch (error) {
      logger.error('Error fetching Anthropic models', error);
      throw new Error(
        `Failed to fetch models from Anthropic: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Map Anthropic model to AIModel format
   */
  private mapAnthropicModel(model: AnthropicModelResponse['data'][0]): AIModel {
    return {
      id: model.id,
      name: model.display_name,
      description: `Claude model from Anthropic`,
      contextWindow: 200000, // Most Claude models support 200k context
      maxOutputTokens: 8192,
    };
  }

  /**
   * Create language model instance
   */
  createLanguageModel(modelId: string): LanguageModel {
    return this.anthropic(modelId);
  }

  getKeyPreview(apiKey: string): string {
    return 'sk-ant-' + apiKey.substring(7, 15) + '...';
  }
}
