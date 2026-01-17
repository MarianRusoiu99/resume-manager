"use strict";
/**
 * Service Result Types
 *
 * Provides unified result types for all service layer operations.
 * Ensures consistency in error handling across the application.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.success = success;
exports.failure = failure;
exports.isSuccess = isSuccess;
exports.isFailure = isFailure;
exports.mapSuccess = mapSuccess;
exports.chainResult = chainResult;
exports.errorCodeToStatus = errorCodeToStatus;
/**
 * Create a successful result
 */
function success(data) {
    return { success: true, data };
}
/**
 * Create a failure result
 */
function failure(error, code) {
    return { success: false, error, code };
}
/**
 * Type guard to check if result is successful
 */
function isSuccess(result) {
    return result.success === true;
}
/**
 * Type guard to check if result is a failure
 */
function isFailure(result) {
    return result.success === false;
}
/**
 * Map a successful result to a new type
 */
function mapSuccess(result, fn) {
    if (isSuccess(result)) {
        return success(fn(result.data));
    }
    return result;
}
/**
 * Chain service results (flatMap)
 */
async function chainResult(result, fn) {
    if (isSuccess(result)) {
        return fn(result.data);
    }
    return result;
}
/**
 * Convert error code to HTTP status
 */
function errorCodeToStatus(code) {
    switch (code) {
        case 'NOT_FOUND':
            return 404;
        case 'UNAUTHORIZED':
            return 401;
        case 'FORBIDDEN':
            return 403;
        case 'VALIDATION_ERROR':
            return 400;
        case 'CONFLICT':
            return 409;
        case 'RATE_LIMITED':
            return 429;
        case 'EXTERNAL_SERVICE_ERROR':
            return 502;
        case 'CONFIGURATION_ERROR':
            return 500;
        case 'INTERNAL_ERROR':
        default:
            return 500;
    }
}
