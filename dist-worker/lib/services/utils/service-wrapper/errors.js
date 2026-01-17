"use strict";
/**
 * Service Wrapper - Error Classes
 *
 * Error handling classes and utilities for service operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceErrors = exports.ServiceOperationError = exports.ExternalServiceError = exports.RateLimitError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.NotFoundError = exports.AppError = void 0;
exports.appErrorToServiceCode = appErrorToServiceCode;
exports.isServiceOperationError = isServiceOperationError;
const errors_1 = require("../../../errors");
Object.defineProperty(exports, "AppError", { enumerable: true, get: function () { return errors_1.AppError; } });
Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function () { return errors_1.NotFoundError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return errors_1.ValidationError; } });
Object.defineProperty(exports, "UnauthorizedError", { enumerable: true, get: function () { return errors_1.UnauthorizedError; } });
Object.defineProperty(exports, "ForbiddenError", { enumerable: true, get: function () { return errors_1.ForbiddenError; } });
Object.defineProperty(exports, "ConflictError", { enumerable: true, get: function () { return errors_1.ConflictError; } });
Object.defineProperty(exports, "RateLimitError", { enumerable: true, get: function () { return errors_1.RateLimitError; } });
Object.defineProperty(exports, "ExternalServiceError", { enumerable: true, get: function () { return errors_1.ExternalServiceError; } });
/**
 * @deprecated Use specific AppError subclasses instead. This class will be removed in a future version.
 */
class ServiceOperationError extends Error {
    constructor(message, code = 'INTERNAL_ERROR', cause) {
        super(message);
        this.code = code;
        this.cause = cause;
        this.name = 'ServiceOperationError';
    }
}
exports.ServiceOperationError = ServiceOperationError;
function appErrorToServiceCode(error) {
    const codeMap = {
        NOT_FOUND: 'NOT_FOUND',
        VALIDATION_ERROR: 'VALIDATION_ERROR',
        UNAUTHORIZED: 'UNAUTHORIZED',
        FORBIDDEN: 'FORBIDDEN',
        CONFLICT: 'CONFLICT',
        RATE_LIMITED: 'RATE_LIMITED',
        EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
        CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
        INTERNAL_ERROR: 'INTERNAL_ERROR',
    };
    return codeMap[error.code] ?? 'INTERNAL_ERROR';
}
function isServiceOperationError(error) {
    return error instanceof ServiceOperationError;
}
exports.ServiceErrors = {
    notFound: (resource) => new ServiceOperationError(`${resource} not found`, 'NOT_FOUND'),
    unauthorized: (message = 'Unauthorized') => new ServiceOperationError(message, 'UNAUTHORIZED'),
    forbidden: (message = 'Access denied') => new ServiceOperationError(message, 'FORBIDDEN'),
    conflict: (message) => new ServiceOperationError(message, 'CONFLICT'),
    validation: (message) => new ServiceOperationError(message, 'VALIDATION_ERROR'),
    rateLimited: (message = 'Too many requests') => new ServiceOperationError(message, 'RATE_LIMITED'),
    externalService: (message, cause) => new ServiceOperationError(message, 'EXTERNAL_SERVICE_ERROR', cause),
};
