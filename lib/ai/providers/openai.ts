/**
 * OpenAI Provider Implementation
 */

import { createOpenAI } from '@ai-sdk/openai';
import { BaseAIProvider, type AIModel, type ProviderConfig } from './base';
import type { LanguageModel } from 'ai';
import { logger } from '@/lib/utils/logger';
import { createAIErrorFromResponse, AIProviderError } from '@/lib/errors';

interface OpenAIModelResponse {
  data: Array<{
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }>;
}

/**
 * OpenAI Provider
 */
export class OpenAIProvider extends BaseAIProvider {
  readonly type = 'openai';
  readonly name = 'OpenAI';

  private readonly openai: ReturnType<typeof createOpenAI>;

  constructor(config: ProviderConfig) {
    super(config);
    this.openai = createOpenAI({
      apiKey: config.apiKey,
    });
  }

  /**
   * Validate OpenAI API key format
   * Format: sk-[project-id-optional]<20-100 alphanumeric/underscore/hyphen chars>
   */
  validateApiKey(apiKey: string): boolean {
    // Modern OpenAI keys: sk-proj-... or legacy sk-...
    return /^sk-[a-zA-Z0-9_-]{20,}$/.test(apiKey);
  }

  /**
   * Fetch available models from OpenAI API
   */
  async fetchModels(): Promise<AIModel[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw createAIErrorFromResponse('OpenAI', response.status, response.statusText);
      }

      const data = await response.json() as OpenAIModelResponse;

      // Filter to GPT, o-series, and gpt-5 models (text generation)
      const gptModels = data.data
        .filter((model) => /^(gpt-|o[13]|gpt-5)/.test(model.id))
        .map((model) => this.mapOpenAIModel(model.id))
        .sort((a, b) => {
          // Sort: gpt-4 variants first, then gpt-3.5, then others
          const order = ['gpt-4', 'gpt-3.5', 'gpt'];
          const aPrefix = order.find((prefix) => a.id.startsWith(prefix)) || 'zzz';
          const bPrefix = order.find((prefix) => b.id.startsWith(prefix)) || 'zzz';
          
          if (aPrefix !== bPrefix) {
            return order.indexOf(aPrefix) - order.indexOf(bPrefix);
          }
          
          return a.id.localeCompare(b.id);
        });

      return gptModels;
    } catch (error) {
      logger.error('Error fetching OpenAI models', error);
      throw new AIProviderError('OpenAI', `Failed to fetch models: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, error);
    }
  }

  /**
   * Map OpenAI model ID to AIModel format
   */
  private mapOpenAIModel(modelId: string): AIModel {
    // Known model metadata
    const modelMetadata: Array<{ pattern: string | RegExp, metadata: Partial<AIModel> }> = [
      {
        pattern: /^gpt-4o(-\d{4}-\d{2}-\d{2})?$/,
        metadata: {
          name: 'GPT-4o',
          description: 'Most advanced multimodal model',
          contextWindow: 128000,
          maxOutputTokens: 4096,
          capabilities: { vision: true, structuredOutput: true },
        },
      },
      {
        pattern: /^gpt-4o-mini(-\d{4}-\d{2}-\d{2})?$/,
        metadata: {
          name: 'GPT-4o Mini',
          description: 'Affordable and intelligent small model',
          contextWindow: 128000,
          maxOutputTokens: 16384,
          capabilities: { vision: true, structuredOutput: true },
        },
      },
      {
        pattern: /^gpt-4-turbo(-\d{4}-\d{2}-\d{2})?$/,
        metadata: {
          name: 'GPT-4 Turbo',
          description: 'High-performance GPT-4 variant',
          contextWindow: 128000,
          maxOutputTokens: 4096,
          capabilities: { vision: true, structuredOutput: true },
        },
      },
      {
        pattern: /^gpt-4(-\d{4})?$/,
        metadata: {
          name: 'GPT-4',
          description: 'Most capable GPT-4 model',
          contextWindow: 8192,
          maxOutputTokens: 4096,
          capabilities: { vision: false, structuredOutput: true },
        },
      },
      {
        pattern: /^gpt-3\.5-turbo(-\d{4})?$/,
        metadata: {
          name: 'GPT-3.5 Turbo',
          description: 'Fast and cost-effective',
          contextWindow: 16385,
          maxOutputTokens: 4096,
          capabilities: { vision: false, structuredOutput: true },
        },
      },
    ];

    const match = modelMetadata.find(m => 
      typeof m.pattern === 'string' ? m.pattern === modelId : m.pattern.test(modelId)
    );
    
    const metadata = match?.metadata || {};

    // Detect reasoning capability from model ID
    const hasReasoning = /^(o[13]|gpt-5)/.test(modelId);

    return {
      id: modelId,
      name: metadata.name || this.formatModelName(modelId),
      description: metadata.description,
      contextWindow: metadata.contextWindow,
      maxOutputTokens: metadata.maxOutputTokens,
      capabilities: {
        ...metadata.capabilities,
        ...(hasReasoning ? { reasoning: true } : {}),
      },
    };
  }

  /**
   * Format model ID into a readable name
   */
  private formatModelName(modelId: string): string {
    return modelId
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  /**
   * Create language model instance
   */
  createLanguageModel(modelId: string): LanguageModel {
    return this.openai(modelId);
  }

  getKeyPreview(apiKey: string): string {
    // Show project ID if present (sk-proj-xyz...) or first 12 chars
    if (apiKey.startsWith('sk-proj-')) {
      const parts = apiKey.split('-');
      return `sk-proj-${parts[2]?.substring(0, 8) || ''}...`;
    }
    return super.getKeyPreview(apiKey);
  }
}
