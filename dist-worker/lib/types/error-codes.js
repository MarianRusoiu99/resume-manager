"use strict";
/**
 * Service Error Codes
 *
 * Standardized error codes used across all service layer operations.
 * These provide consistent error handling and better debugging.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorCodeToHttpStatus = exports.ErrorCode = void 0;
exports.getErrorMessage = getErrorMessage;
/**
 * Error codes for service layer operations
 */
exports.ErrorCode = {
    /** Resource not found (404 equivalent) */
    NOT_FOUND: 'NOT_FOUND',
    /** Validation failed (400 equivalent) */
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    /** Internal server error (500 equivalent) */
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    /** Authentication required (401 equivalent) */
    UNAUTHORIZED: 'UNAUTHORIZED',
    /** Permission denied (403 equivalent) */
    FORBIDDEN: 'FORBIDDEN',
    /** Rate limit exceeded (429 equivalent) */
    RATE_LIMITED: 'RATE_LIMITED',
    /** External service error (e.g., AI provider) */
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
    /** Configuration missing or invalid */
    CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
    /** Conflict with existing resource */
    CONFLICT: 'CONFLICT',
    /** Method not allowed (405 equivalent) */
    METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
    /** Payload too large (413 equivalent) */
    PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
    /** Request timeout (408 equivalent) */
    REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
};
/**
 * Map error codes to HTTP status codes
 */
exports.errorCodeToHttpStatus = {
    [exports.ErrorCode.NOT_FOUND]: 404,
    [exports.ErrorCode.VALIDATION_ERROR]: 400,
    [exports.ErrorCode.INTERNAL_ERROR]: 500,
    [exports.ErrorCode.UNAUTHORIZED]: 401,
    [exports.ErrorCode.FORBIDDEN]: 403,
    [exports.ErrorCode.RATE_LIMITED]: 429,
    [exports.ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
    [exports.ErrorCode.CONFIGURATION_ERROR]: 500,
    [exports.ErrorCode.METHOD_NOT_ALLOWED]: 405,
    [exports.ErrorCode.PAYLOAD_TOO_LARGE]: 413,
    [exports.ErrorCode.REQUEST_TIMEOUT]: 408,
    [exports.ErrorCode.CONFLICT]: 409,
};
/**
 * Get user-friendly error message for error code
 */
function getErrorMessage(code) {
    const messages = {
        [exports.ErrorCode.NOT_FOUND]: 'The requested resource was not found',
        [exports.ErrorCode.VALIDATION_ERROR]: 'The provided data is invalid',
        [exports.ErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred',
        [exports.ErrorCode.UNAUTHORIZED]: 'Authentication is required',
        [exports.ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action',
        [exports.ErrorCode.RATE_LIMITED]: 'Too many requests, please try again later',
        [exports.ErrorCode.EXTERNAL_SERVICE_ERROR]: 'An external service is unavailable',
        [exports.ErrorCode.CONFIGURATION_ERROR]: 'System configuration error',
        [exports.ErrorCode.CONFLICT]: 'This operation conflicts with existing data',
        [exports.ErrorCode.METHOD_NOT_ALLOWED]: 'The requested method is not allowed',
        [exports.ErrorCode.PAYLOAD_TOO_LARGE]: 'The request payload is too large',
        [exports.ErrorCode.REQUEST_TIMEOUT]: 'The request timed out',
    };
    return messages[code];
}
