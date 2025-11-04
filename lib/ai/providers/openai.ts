import OpenAI from 'openai';
import {
  AIProvider,
  AIProviderConfig,
  AIProviderCapabilities,
  AIMessage,
  AICompletionResponse,
  AICompletionOptions
} from './base';
import type { ProviderHealthCheck } from '../types/provider-types';

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  private client: OpenAI;
  private config: AIProviderConfig;

  readonly capabilities: AIProviderCapabilities = {
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctionCalling: true,
    maxContextLength: 128000, // GPT-4 Turbo
    defaultModel: 'gpt-4-turbo-preview',
    availableModels: [
      'gpt-4-turbo-preview',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k'
    ]
  };

  constructor(config: AIProviderConfig) {
    this.config = {
      model: config.model || this.capabilities.defaultModel,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2000,
      apiKey: config.apiKey
    };

    this.client = new OpenAI({
      apiKey: this.config.apiKey
    });
  }

  async complete(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): Promise<AICompletionResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model || this.capabilities.defaultModel,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: options?.temperature ?? this.config.temperature,
        max_tokens: options?.maxTokens ?? this.config.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stopSequences
      });

      const choice = response.choices[0];
      if (!choice || !choice.message.content) {
        throw new Error('No response from OpenAI');
      }

      return {
        content: choice.message.content,
        finishReason: this.mapFinishReason(choice.finish_reason),
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        },
        model: response.model
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI completion failed: ${error.message}`);
      }
      throw new Error('OpenAI completion failed: Unknown error');
    }
  }

  async validate(): Promise<boolean> {
    try {
      // Make a minimal API call to validate the key
      await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      });
      return true;
    } catch (error) {
      console.error('OpenAI validation failed:', error);
      return false;
    }
  }

  async healthCheck(): Promise<ProviderHealthCheck> {
    const startTime = Date.now();
    const timestamp = new Date();

    try {
      // Make a minimal API call to check health
      await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5
      });

      const responseTime = Date.now() - startTime;

      return {
        healthy: true,
        responseTime,
        timestamp
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
        timestamp
      };
    }
  }

  getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  private mapFinishReason(
    reason: string | null | undefined
  ): 'stop' | 'length' | 'content_filter' | 'tool_calls' {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      case 'tool_calls':
      case 'function_call':
        return 'tool_calls';
      default:
        return 'stop';
    }
  }
}
