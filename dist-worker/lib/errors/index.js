"use strict";
/**
 * Application Error Classes
 *
 * Typed error classes for consistent error handling across the application.
 * Each error class maps to a specific HTTP status code and error type.
 *
 * @example
 * ```typescript
 * import { NotFoundError, ValidationError } from '@/lib/errors';
 *
 * throw new NotFoundError('Profile');
 * throw new ValidationError('Invalid email format');
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidationError = exports.InvalidFormatError = exports.FieldLengthError = exports.InvalidFieldError = exports.RequiredFieldError = exports.SchemaValidationError = exports.TypedValidationError = exports.isApiError = exports.PayloadTooLargeError = exports.RequestTimeoutError = exports.MethodNotAllowedError = exports.BadRequestError = exports.ServiceUnavailableError = exports.RateLimitError = exports.ApiError = exports.isAuthenticationError = exports.AccountLockedError = exports.InvalidTokenError = exports.SessionExpiredError = exports.InvalidCredentialsError = exports.ForbiddenError = exports.UnauthorizedError = exports.AuthenticationError = exports.isDatabaseError = exports.DatabaseQueryError = exports.DatabaseTransactionError = exports.DatabaseConnectionError = exports.ForeignKeyConstraintError = exports.UniqueConstraintError = exports.RecordNotFoundError = exports.DatabaseError = exports.createAIErrorFromResponse = exports.isAIError = exports.AIQuotaExceededError = exports.AIContextLengthError = exports.AIRateLimitError = exports.ModelNotFoundError = exports.InvalidAPIKeyError = exports.UnsupportedProviderError = exports.AIProviderNotConfiguredError = exports.AIProviderError = exports.AIError = exports.InternalError = exports.ConfigurationError = exports.ExternalServiceError = exports.ConflictError = exports.ValidationError = exports.NotFoundError = exports.isAppError = exports.AppError = void 0;
exports.getErrorStatusCode = getErrorStatusCode;
exports.getErrorCode = getErrorCode;
exports.wrapError = wrapError;
const base_1 = require("./base");
// Re-export base error class and type guard
var base_2 = require("./base");
Object.defineProperty(exports, "AppError", { enumerable: true, get: function () { return base_2.AppError; } });
Object.defineProperty(exports, "isAppError", { enumerable: true, get: function () { return base_2.isAppError; } });
/**
 * Resource not found error (404)
 */
class NotFoundError extends base_1.AppError {
    constructor(resource = 'Resource', cause) {
        super(`${resource} not found`, cause);
        this.code = 'NOT_FOUND';
        this.statusCode = 404;
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Validation error (400)
 */
class ValidationError extends base_1.AppError {
    constructor(message, field, details, cause) {
        super(message, cause);
        this.field = field;
        this.details = details;
        this.code = 'VALIDATION_ERROR';
        this.statusCode = 400;
    }
}
exports.ValidationError = ValidationError;
/**
 * Conflict error (409)
 */
class ConflictError extends base_1.AppError {
    constructor(message = 'Conflict', cause) {
        super(message, cause);
        this.code = 'CONFLICT';
        this.statusCode = 409;
    }
}
exports.ConflictError = ConflictError;
/**
 * External service error (502)
 */
class ExternalServiceError extends base_1.AppError {
    constructor(service, message, cause) {
        super(message || `${service} service unavailable`, cause);
        this.code = 'EXTERNAL_SERVICE_ERROR';
        this.statusCode = 502;
    }
}
exports.ExternalServiceError = ExternalServiceError;
/**
 * Configuration error (500)
 */
class ConfigurationError extends base_1.AppError {
    constructor(message = 'System configuration error', cause) {
        super(message, cause);
        this.code = 'CONFIGURATION_ERROR';
        this.statusCode = 500;
    }
}
exports.ConfigurationError = ConfigurationError;
/**
 * Internal server error (500)
 */
class InternalError extends base_1.AppError {
    constructor(message = 'Internal server error', cause) {
        super(message, cause);
        this.code = 'INTERNAL_ERROR';
        this.statusCode = 500;
    }
}
exports.InternalError = InternalError;
/**
 * Get HTTP status code from any error
 */
function getErrorStatusCode(error) {
    if ((0, base_1.isAppError)(error)) {
        return error.statusCode;
    }
    return 500;
}
/**
 * Get error code from any error
 */
function getErrorCode(error) {
    if ((0, base_1.isAppError)(error)) {
        return error.code;
    }
    return 'INTERNAL_ERROR';
}
/**
 * Create an appropriate AppError from an unknown error
 */
function wrapError(error, defaultMessage = 'An error occurred') {
    if ((0, base_1.isAppError)(error)) {
        return error;
    }
    if (error instanceof Error) {
        // Common configuration failures should carry a stable code
        if (error.message.toLowerCase().includes('environment configuration')) {
            return new ConfigurationError(error.message, error);
        }
        return new InternalError(error.message, error);
    }
    return new InternalError(defaultMessage, error);
}
// Re-export AI-specific errors
var ai_1 = require("./ai");
Object.defineProperty(exports, "AIError", { enumerable: true, get: function () { return ai_1.AIError; } });
Object.defineProperty(exports, "AIProviderError", { enumerable: true, get: function () { return ai_1.AIProviderError; } });
Object.defineProperty(exports, "AIProviderNotConfiguredError", { enumerable: true, get: function () { return ai_1.AIProviderNotConfiguredError; } });
Object.defineProperty(exports, "UnsupportedProviderError", { enumerable: true, get: function () { return ai_1.UnsupportedProviderError; } });
Object.defineProperty(exports, "InvalidAPIKeyError", { enumerable: true, get: function () { return ai_1.InvalidAPIKeyError; } });
Object.defineProperty(exports, "ModelNotFoundError", { enumerable: true, get: function () { return ai_1.ModelNotFoundError; } });
Object.defineProperty(exports, "AIRateLimitError", { enumerable: true, get: function () { return ai_1.AIRateLimitError; } });
Object.defineProperty(exports, "AIContextLengthError", { enumerable: true, get: function () { return ai_1.AIContextLengthError; } });
Object.defineProperty(exports, "AIQuotaExceededError", { enumerable: true, get: function () { return ai_1.AIQuotaExceededError; } });
Object.defineProperty(exports, "isAIError", { enumerable: true, get: function () { return ai_1.isAIError; } });
Object.defineProperty(exports, "createAIErrorFromResponse", { enumerable: true, get: function () { return ai_1.createAIErrorFromResponse; } });
// Re-export database errors
var database_1 = require("./database");
Object.defineProperty(exports, "DatabaseError", { enumerable: true, get: function () { return database_1.DatabaseError; } });
Object.defineProperty(exports, "RecordNotFoundError", { enumerable: true, get: function () { return database_1.RecordNotFoundError; } });
Object.defineProperty(exports, "UniqueConstraintError", { enumerable: true, get: function () { return database_1.UniqueConstraintError; } });
Object.defineProperty(exports, "ForeignKeyConstraintError", { enumerable: true, get: function () { return database_1.ForeignKeyConstraintError; } });
Object.defineProperty(exports, "DatabaseConnectionError", { enumerable: true, get: function () { return database_1.DatabaseConnectionError; } });
Object.defineProperty(exports, "DatabaseTransactionError", { enumerable: true, get: function () { return database_1.DatabaseTransactionError; } });
Object.defineProperty(exports, "DatabaseQueryError", { enumerable: true, get: function () { return database_1.DatabaseQueryError; } });
Object.defineProperty(exports, "isDatabaseError", { enumerable: true, get: function () { return database_1.isDatabaseError; } });
// Re-export authentication errors
var authentication_1 = require("./authentication");
Object.defineProperty(exports, "AuthenticationError", { enumerable: true, get: function () { return authentication_1.AuthenticationError; } });
Object.defineProperty(exports, "UnauthorizedError", { enumerable: true, get: function () { return authentication_1.UnauthorizedError; } });
Object.defineProperty(exports, "ForbiddenError", { enumerable: true, get: function () { return authentication_1.ForbiddenError; } });
Object.defineProperty(exports, "InvalidCredentialsError", { enumerable: true, get: function () { return authentication_1.InvalidCredentialsError; } });
Object.defineProperty(exports, "SessionExpiredError", { enumerable: true, get: function () { return authentication_1.SessionExpiredError; } });
Object.defineProperty(exports, "InvalidTokenError", { enumerable: true, get: function () { return authentication_1.InvalidTokenError; } });
Object.defineProperty(exports, "AccountLockedError", { enumerable: true, get: function () { return authentication_1.AccountLockedError; } });
Object.defineProperty(exports, "isAuthenticationError", { enumerable: true, get: function () { return authentication_1.isAuthenticationError; } });
// Re-export API errors
var api_1 = require("./api");
Object.defineProperty(exports, "ApiError", { enumerable: true, get: function () { return api_1.ApiError; } });
Object.defineProperty(exports, "RateLimitError", { enumerable: true, get: function () { return api_1.RateLimitError; } });
Object.defineProperty(exports, "ServiceUnavailableError", { enumerable: true, get: function () { return api_1.ServiceUnavailableError; } });
Object.defineProperty(exports, "BadRequestError", { enumerable: true, get: function () { return api_1.BadRequestError; } });
Object.defineProperty(exports, "MethodNotAllowedError", { enumerable: true, get: function () { return api_1.MethodNotAllowedError; } });
Object.defineProperty(exports, "RequestTimeoutError", { enumerable: true, get: function () { return api_1.RequestTimeoutError; } });
Object.defineProperty(exports, "PayloadTooLargeError", { enumerable: true, get: function () { return api_1.PayloadTooLargeError; } });
Object.defineProperty(exports, "isApiError", { enumerable: true, get: function () { return api_1.isApiError; } });
// Re-export validation errors
var validation_1 = require("./validation");
Object.defineProperty(exports, "TypedValidationError", { enumerable: true, get: function () { return validation_1.ValidationError; } });
Object.defineProperty(exports, "SchemaValidationError", { enumerable: true, get: function () { return validation_1.SchemaValidationError; } });
Object.defineProperty(exports, "RequiredFieldError", { enumerable: true, get: function () { return validation_1.RequiredFieldError; } });
Object.defineProperty(exports, "InvalidFieldError", { enumerable: true, get: function () { return validation_1.InvalidFieldError; } });
Object.defineProperty(exports, "FieldLengthError", { enumerable: true, get: function () { return validation_1.FieldLengthError; } });
Object.defineProperty(exports, "InvalidFormatError", { enumerable: true, get: function () { return validation_1.InvalidFormatError; } });
Object.defineProperty(exports, "isValidationError", { enumerable: true, get: function () { return validation_1.isValidationError; } });
