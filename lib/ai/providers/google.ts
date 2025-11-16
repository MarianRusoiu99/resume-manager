/**
 * Google AI Provider Implementation
 * Note: Google support requires @ai-sdk/google package
 */

import type { LanguageModel } from 'ai';
import { BaseAIProvider, type AIModel, type ProviderConfig } from './base';

interface GoogleModelResponse {
  models: Array<{
    name: string;
    baseModelId?: string;
    version?: string;
    displayName: string;
    description: string;
    inputTokenLimit?: number;
    outputTokenLimit?: number;
    supportedGenerationMethods?: string[];
    thinking?: boolean;
    temperature?: number;
    maxTemperature?: number;
    topP?: number;
    topK?: number;
  }>;
  nextPageToken?: string;
}

/**
 * Google AI Provider (Gemini)
 * PLACEHOLDER: Install @ai-sdk/google to enable Google AI support
 */
export class GoogleProvider extends BaseAIProvider {
  readonly type = 'google';
  readonly name = 'Google AI';

  constructor(config: ProviderConfig) {
    super(config);
    throw new Error(
      'Google provider not yet configured. Install @ai-sdk/google package to enable Google AI support.'
    );
  }

  /**
   * Validate Google AI API key format
   * Format: AIza<35 alphanumeric/underscore/hyphen chars>
   */
  validateApiKey(apiKey: string): boolean {
    return /^AIza[a-zA-Z0-9_-]{35}$/.test(apiKey);
  }

  /**
   * Fetch available models from Google AI API
   */
  async fetchModels(): Promise<AIModel[]> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as GoogleModelResponse;

      // Filter to only generative models and map to our format
      const models = data.models
        .filter((model) => 
          model.supportedGenerationMethods?.includes('generateContent')
        )
        .map((model) => this.mapGoogleModel(model))
        .sort((a, b) => {
          // Sort: gemini-2 first, then gemini-1.5, then others
          if (a.id.includes('gemini-2') && !b.id.includes('gemini-2')) return -1;
          if (!a.id.includes('gemini-2') && b.id.includes('gemini-2')) return 1;
          if (a.id.includes('1.5') && !b.id.includes('1.5')) return -1;
          if (!a.id.includes('1.5') && b.id.includes('1.5')) return 1;
          return a.id.localeCompare(b.id);
        });

      return models;
    } catch (error) {
      console.error('Error fetching Google models:', error);
      throw new Error(
        `Failed to fetch models from Google AI: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Map Google model to AIModel format
   */
  private mapGoogleModel(model: GoogleModelResponse['models'][0]): AIModel {
    // Extract model ID from full name (e.g., "models/gemini-pro" -> "gemini-pro")
    const modelId = model.name.replace('models/', '');

    return {
      id: modelId,
      name: model.displayName,
      description: model.description,
      contextWindow: model.inputTokenLimit,
      maxOutputTokens: model.outputTokenLimit,
    };
  }

  /**
   * Create language model instance
   */
  createLanguageModel(): LanguageModel {
    throw new Error('Google provider not yet configured');
  }

  getKeyPreview(apiKey: string): string {
    return 'AIza' + apiKey.substring(4, 12) + '...';
  }
}
