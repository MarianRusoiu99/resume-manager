/**
 * AI Model Pricing Configuration
 * 
 * Stores the cost per 1k tokens for different models.
 * Prices are in USD.
 */

export interface ModelPricing {
  input: number;  // Cost per 1k tokens
  output: number; // Cost per 1k tokens
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },

  // Anthropic
  'claude-3-5-sonnet-20240620': { input: 0.003, output: 0.015 },
  'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
  'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },

  // Google
  'gemini-1.5-pro': { input: 0.0035, output: 0.0105 },
  'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
};

/**
 * Default pricing for unknown models
 */
export const DEFAULT_PRICING: ModelPricing = {
  input: 0.01,
  output: 0.03,
};

/**
 * Calculate the cost of an AI operation
 */
export function calculateAICost(
  modelId: string,
  usage: { 
    promptTokens?: number; 
    completionTokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
    inputTokens?: number;
    outputTokens?: number;
  }
): number {
  const pricing = MODEL_PRICING[modelId] || DEFAULT_PRICING;
  
  const promptTokens = usage.promptTokens ?? usage.prompt_tokens ?? usage.inputTokens ?? 0;
  const completionTokens = usage.completionTokens ?? usage.completion_tokens ?? usage.outputTokens ?? 0;

  const inputCost = (promptTokens / 1000) * pricing.input;
  const outputCost = (completionTokens / 1000) * pricing.output;
  
  return Number((inputCost + outputCost).toFixed(6));
}
