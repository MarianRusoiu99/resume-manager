/**
 * AI Model Configuration
 * 
 * Centralized configuration for AI models, temperatures, and token limits
 */

export interface ModelConfig {
  name: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * Model configurations for different agents
 */
export const MODEL_CONFIGS = {
  /**
   * Job Analysis: Lower temperature for consistent extraction
   */
  JOB_ANALYSIS: {
    name: 'gpt-4-turbo-preview',
    temperature: 0.3,
    maxTokens: 2000,
    topP: 1.0
  } as ModelConfig,

  /**
   * Profile Matching: Moderate temperature for analytical comparison
   */
  PROFILE_MATCHING: {
    name: 'gpt-4-turbo-preview',
    temperature: 0.4,
    maxTokens: 1500,
    topP: 1.0
  } as ModelConfig,

  /**
   * Content Optimization: Higher temperature for creative writing
   */
  CONTENT_OPTIMIZATION: {
    name: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 4000,
    topP: 0.95,
    frequencyPenalty: 0.3,  // Reduce repetition
    presencePenalty: 0.2     // Encourage variety
  } as ModelConfig,

  /**
   * Format Validation: Lower temperature for consistent checking
   */
  FORMAT_VALIDATION: {
    name: 'gpt-4-turbo-preview',
    temperature: 0.2,
    maxTokens: 1000,
    topP: 1.0
  } as ModelConfig,

  /**
   * Cover Letter: Creative temperature for engaging writing
   */
  COVER_LETTER: {
    name: 'gpt-4-turbo-preview',
    temperature: 0.8,
    maxTokens: 1500,
    topP: 0.9,
    frequencyPenalty: 0.5,
    presencePenalty: 0.3
  } as ModelConfig,

  /**
   * Default: Fallback configuration
   */
  DEFAULT: {
    name: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1.0
  } as ModelConfig
} as const;

/**
 * Get model configuration by agent type
 */
export type AgentType = 
  | 'job-analysis'
  | 'profile-matching'
  | 'content-optimization'
  | 'format-validation'
  | 'cover-letter';

export function getModelConfig(agentType: AgentType): ModelConfig {
  const configMap: Record<AgentType, ModelConfig> = {
    'job-analysis': MODEL_CONFIGS.JOB_ANALYSIS,
    'profile-matching': MODEL_CONFIGS.PROFILE_MATCHING,
    'content-optimization': MODEL_CONFIGS.CONTENT_OPTIMIZATION,
    'format-validation': MODEL_CONFIGS.FORMAT_VALIDATION,
    'cover-letter': MODEL_CONFIGS.COVER_LETTER
  };

  return configMap[agentType] || MODEL_CONFIGS.DEFAULT;
}

/**
 * Override model configuration with custom values
 */
export function overrideModelConfig(
  baseConfig: ModelConfig,
  overrides: Partial<ModelConfig>
): ModelConfig {
  return {
    ...baseConfig,
    ...overrides
  };
}
