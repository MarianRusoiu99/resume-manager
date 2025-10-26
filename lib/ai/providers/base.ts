/**
 * Base interface for AI providers
 * Supports OpenAI, Anthropic, Google, etc.
 */

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIProviderCapabilities {
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
  maxContextLength: number;
  defaultModel: string;
  availableModels: string[];
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export interface AICompletionOptions {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * Base AIProvider interface that all providers must implement
 */
export interface AIProvider {
  readonly name: string;
  readonly capabilities: AIProviderCapabilities;

  /**
   * Generate a completion from a list of messages
   */
  complete(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): Promise<AICompletionResponse>;

  /**
   * Validate that the API key works
   */
  validate(): Promise<boolean>;

  /**
   * Get the current configuration
   */
  getConfig(): AIProviderConfig;
}
