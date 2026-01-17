"use strict";
/**
 * AI-Specific Error Classes
 *
 * Error classes for AI provider and enhancement operations.
 * Provides specific error types for better error handling and user messaging.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIQuotaExceededError = exports.AIContextLengthError = exports.AIRateLimitError = exports.ModelNotFoundError = exports.InvalidAPIKeyError = exports.UnsupportedProviderError = exports.AIProviderError = exports.AIProviderNotConfiguredError = exports.AIError = void 0;
exports.isAIError = isAIError;
exports.createAIErrorFromResponse = createAIErrorFromResponse;
const base_1 = require("./base");
/**
 * Base AI error class
 */
class AIError extends base_1.AppError {
    constructor(message, provider, cause) {
        super(message, cause);
        this.provider = provider;
    }
}
exports.AIError = AIError;
/**
 * AI Provider not configured error
 * Thrown when user tries to use AI features without configuring a provider
 */
class AIProviderNotConfiguredError extends AIError {
    constructor() {
        super('No AI provider configured. Please add an API key in Settings → API Keys.');
        this.code = 'NOT_FOUND';
        this.statusCode = 400;
    }
}
exports.AIProviderNotConfiguredError = AIProviderNotConfiguredError;
/**
 * AI Provider error
 * Thrown when there's an issue with the AI provider
 */
class AIProviderError extends AIError {
    constructor(provider, message, providerErrorCode, cause) {
        super(`${provider} error: ${message}`, provider, cause);
        this.providerErrorCode = providerErrorCode;
        this.code = 'EXTERNAL_SERVICE_ERROR';
        this.statusCode = 502;
    }
}
exports.AIProviderError = AIProviderError;
/**
 * Unsupported provider error
 * Thrown when trying to use a provider that isn't implemented
 */
class UnsupportedProviderError extends AIError {
    constructor(provider, supportedProviders, cause) {
        super(`Unsupported AI provider: ${provider}. Supported providers: ${supportedProviders.join(', ')}`, provider, cause);
        this.code = 'VALIDATION_ERROR';
        this.statusCode = 400;
    }
}
exports.UnsupportedProviderError = UnsupportedProviderError;
/**
 * Invalid API key error
 * Thrown when the API key format is invalid or the key is rejected by the provider
 */
class InvalidAPIKeyError extends AIError {
    constructor(provider, reason, cause) {
        super(reason
            ? `Invalid API key for ${provider}: ${reason}`
            : `Invalid API key format for ${provider}`, provider, cause);
        this.code = 'VALIDATION_ERROR';
        this.statusCode = 400;
    }
}
exports.InvalidAPIKeyError = InvalidAPIKeyError;
/**
 * Model not found error
 * Thrown when the requested model doesn't exist or isn't available
 */
class ModelNotFoundError extends AIError {
    constructor(modelId, provider, cause) {
        super(provider
            ? `Model ${modelId} not found for provider ${provider}`
            : `Model ${modelId} not found in your configured providers`, provider, cause);
        this.code = 'NOT_FOUND';
        this.statusCode = 404;
    }
}
exports.ModelNotFoundError = ModelNotFoundError;
/**
 * AI rate limit error
 * Thrown when the AI provider rate limit is exceeded
 */
class AIRateLimitError extends AIError {
    constructor(provider, retryAfterMs, cause) {
        super(retryAfterMs
            ? `${provider} rate limit exceeded. Please try again in ${Math.ceil(retryAfterMs / 1000)} seconds.`
            : `${provider} rate limit exceeded. Please try again later.`, provider, cause);
        this.retryAfterMs = retryAfterMs;
        this.code = 'RATE_LIMITED';
        this.statusCode = 429;
    }
}
exports.AIRateLimitError = AIRateLimitError;
/**
 * AI context length exceeded error
 * Thrown when the input content is too long for the model
 */
class AIContextLengthError extends AIError {
    constructor(maxTokens, actualTokens, cause) {
        super(actualTokens
            ? `Content too long: ${actualTokens} tokens exceeds maximum of ${maxTokens} tokens`
            : `Content exceeds the maximum context length of ${maxTokens} tokens`, undefined, cause);
        this.maxTokens = maxTokens;
        this.actualTokens = actualTokens;
        this.code = 'VALIDATION_ERROR';
        this.statusCode = 400;
    }
}
exports.AIContextLengthError = AIContextLengthError;
/**
 * AI quota exceeded error
 * Thrown when the user's AI quota/credits are exhausted
 */
class AIQuotaExceededError extends AIError {
    constructor(provider, cause) {
        super(`${provider} quota exceeded. Please check your billing settings or upgrade your plan.`, provider, cause);
        this.code = 'FORBIDDEN';
        this.statusCode = 403;
    }
}
exports.AIQuotaExceededError = AIQuotaExceededError;
/**
 * Type guard to check if an error is an AI error
 */
function isAIError(error) {
    return error instanceof AIError;
}
/**
 * Create appropriate AI error from provider error response
 */
function createAIErrorFromResponse(provider, status, message, errorCode) {
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
