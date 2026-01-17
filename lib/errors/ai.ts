/**
 * AI-Specific Error Classes
 * 
 * Error classes for AI provider and enhancement operations.
 * Provides specific error types for better error handling and user messaging.
 */

import type { ServiceErrorCode } from '@/lib/types';
import { AppError } from './base';

/**
 * Base AI error class
 */
export abstract class AIError extends AppError {
  constructor(
    message: string,
    public readonly provider?: string,
    cause?: unknown
  ) {
    super(message, cause);
  }
}

/**
 * AI Provider not configured error
 * Thrown when user tries to use AI features without configuring a provider
 */
export class AIProviderNotConfiguredError extends AIError {
  readonly code = 'NOT_FOUND' as ServiceErrorCode;
  readonly statusCode = 400;

  constructor() {
    super('No AI provider configured. Please add an API key in Settings → API Keys.');
  }
}

/**
 * AI Provider error
 * Thrown when there's an issue with the AI provider
 */
export class AIProviderError extends AIError {
  readonly code = 'EXTERNAL_SERVICE_ERROR' as ServiceErrorCode;
  readonly statusCode = 502;

  constructor(
    provider: string,
    message: string,
    public readonly providerErrorCode?: string,
    cause?: unknown
  ) {
    super(`${provider} error: ${message}`, provider, cause);
  }
}

/**
 * Unsupported provider error
 * Thrown when trying to use a provider that isn't implemented
 */
export class UnsupportedProviderError extends AIError {
  readonly code = 'VALIDATION_ERROR' as ServiceErrorCode;
  readonly statusCode = 400;

  constructor(provider: string, supportedProviders: string[], cause?: unknown) {
    super(
      `Unsupported AI provider: ${provider}. Supported providers: ${supportedProviders.join(', ')}`,
      provider,
      cause
    );
  }
}

/**
 * Invalid API key error
 * Thrown when the API key format is invalid or the key is rejected by the provider
 */
export class InvalidAPIKeyError extends AIError {
  readonly code = 'VALIDATION_ERROR' as ServiceErrorCode;
  readonly statusCode = 400;

  constructor(provider: string, reason?: string, cause?: unknown) {
    super(
      reason 
        ? `Invalid API key for ${provider}: ${reason}`
        : `Invalid API key format for ${provider}`,
      provider,
      cause
    );
  }
}

/**
 * Model not found error
 * Thrown when the requested model doesn't exist or isn't available
 */
export class ModelNotFoundError extends AIError {
  readonly code = 'NOT_FOUND' as ServiceErrorCode;
  readonly statusCode = 404;

  constructor(modelId: string, provider?: string, cause?: unknown) {
    super(
      provider
        ? `Model ${modelId} not found for provider ${provider}`
        : `Model ${modelId} not found in your configured providers`,
      provider,
      cause
    );
  }
}

/**
 * AI rate limit error
 * Thrown when the AI provider rate limit is exceeded
 */
export class AIRateLimitError extends AIError {
  readonly code = 'RATE_LIMITED' as ServiceErrorCode;
  readonly statusCode = 429;

  constructor(
    provider: string,
    public readonly retryAfterMs?: number,
    cause?: unknown
  ) {
    super(
      retryAfterMs
        ? `${provider} rate limit exceeded. Please try again in ${Math.ceil(retryAfterMs / 1000)} seconds.`
        : `${provider} rate limit exceeded. Please try again later.`,
      provider,
      cause
    );
  }
}

/**
 * AI context length exceeded error
 * Thrown when the input content is too long for the model
 */
export class AIContextLengthError extends AIError {
  readonly code = 'VALIDATION_ERROR' as ServiceErrorCode;
  readonly statusCode = 400;

  constructor(
    public readonly maxTokens: number,
    public readonly actualTokens?: number,
    cause?: unknown
  ) {
    super(
      actualTokens
        ? `Content too long: ${actualTokens} tokens exceeds maximum of ${maxTokens} tokens`
        : `Content exceeds the maximum context length of ${maxTokens} tokens`,
      undefined,
      cause
    );
  }
}

/**
 * AI quota exceeded error
 * Thrown when the user's AI quota/credits are exhausted
 */
export class AIQuotaExceededError extends AIError {
  readonly code = 'FORBIDDEN' as ServiceErrorCode;
  readonly statusCode = 403;

  constructor(provider: string, cause?: unknown) {
    super(
      `${provider} quota exceeded. Please check your billing settings or upgrade your plan.`,
      provider,
      cause
    );
  }
}

/**
 * Type guard to check if an error is an AI error
 */
export function isAIError(error: unknown): error is AIError {
  return error instanceof AIError;
}

/**
 * Create appropriate AI error from provider error response
 */
export function createAIErrorFromResponse(
  provider: string,
  status: number,
  message: string,
  errorCode?: string
): AIError {
  switch (status) {
    case 401:
      return new InvalidAPIKeyError(provider, 'Authentication failed');
    case 429:
      return new AIRateLimitError(provider);
    case 400:
      if (message.toLowerCase().includes('context') || message.toLowerCase().includes('token')) {
        return new AIContextLengthError(0);
      }
      return new AIProviderError(provider, message, errorCode);
    case 403:
      if (message.toLowerCase().includes('quota') || message.toLowerCase().includes('billing')) {
        return new AIQuotaExceededError(provider);
      }
      return new AIProviderError(provider, message, errorCode);
    default:
      return new AIProviderError(provider, message, errorCode);
  }
}
