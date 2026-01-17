"use strict";
/**
 * API Error Classes
 *
 * Error classes for API operations including rate limiting and service availability.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayloadTooLargeError = exports.RequestTimeoutError = exports.MethodNotAllowedError = exports.BadRequestError = exports.ServiceUnavailableError = exports.RateLimitError = exports.ApiError = void 0;
exports.isApiError = isApiError;
const base_1 = require("./base");
/**
 * Base API error class
 */
class ApiError extends base_1.AppError {
    constructor(message, cause) {
        super(message, cause);
    }
}
exports.ApiError = ApiError;
/**
 * Rate limit exceeded error (429)
 * Thrown when API rate limit is exceeded
 */
class RateLimitError extends ApiError {
    constructor(message = 'Too many requests. Please try again later.', retryAfterMs, cause) {
        super(message, cause);
        this.retryAfterMs = retryAfterMs;
        this.code = 'RATE_LIMITED';
        this.statusCode = 429;
    }
}
exports.RateLimitError = RateLimitError;
/**
 * Service unavailable error (503)
 * Thrown when a service is temporarily unavailable
 */
class ServiceUnavailableError extends ApiError {
    constructor(service, message, cause) {
        super(message || `${service} is temporarily unavailable`, cause);
        this.service = service;
        this.code = 'EXTERNAL_SERVICE_ERROR';
        this.statusCode = 503;
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
/**
 * Bad request error (400)
 * Thrown when request is malformed or invalid
 */
class BadRequestError extends ApiError {
    constructor(message = 'Bad request', cause) {
        super(message, cause);
        this.code = 'VALIDATION_ERROR';
        this.statusCode = 400;
    }
}
exports.BadRequestError = BadRequestError;
/**
 * Method not allowed error (405)
 * Thrown when HTTP method is not supported for the endpoint
 */
class MethodNotAllowedError extends ApiError {
    constructor(method, allowedMethods = [], cause) {
        const allowed = allowedMethods.length > 0
            ? ` Allowed methods: ${allowedMethods.join(', ')}`
            : '';
        super(`Method ${method} not allowed.${allowed}`, cause);
        this.method = method;
        this.allowedMethods = allowedMethods;
        this.code = 'METHOD_NOT_ALLOWED';
        this.statusCode = 405;
    }
}
exports.MethodNotAllowedError = MethodNotAllowedError;
/**
 * Request timeout error (408)
 * Thrown when request takes too long to process
 */
class RequestTimeoutError extends ApiError {
    constructor(timeoutMs, message, cause) {
        super(message || `Request timeout after ${timeoutMs}ms`, cause);
        this.timeoutMs = timeoutMs;
        this.code = 'REQUEST_TIMEOUT';
        this.statusCode = 408;
    }
}
exports.RequestTimeoutError = RequestTimeoutError;
/**
 * Payload too large error (413)
 * Thrown when request payload exceeds size limit
 */
class PayloadTooLargeError extends ApiError {
    constructor(maxSize, actualSize, cause) {
        const sizeInfo = actualSize
            ? `Payload size ${actualSize} bytes exceeds maximum of ${maxSize} bytes`
            : `Payload exceeds maximum size of ${maxSize} bytes`;
        super(sizeInfo, cause);
        this.maxSize = maxSize;
        this.actualSize = actualSize;
        this.code = 'PAYLOAD_TOO_LARGE';
        this.statusCode = 413;
    }
}
exports.PayloadTooLargeError = PayloadTooLargeError;
/**
 * Type guard to check if an error is an API error
 */
function isApiError(error) {
    return error instanceof ApiError;
}
