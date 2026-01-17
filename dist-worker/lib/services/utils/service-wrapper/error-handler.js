"use strict";
/**
 * Service Wrapper - Error Handler
 *
 * Centralized error handling logic for service operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleServiceError = handleServiceError;
const zod_1 = require("zod");
const logger_1 = require("../../../utils/logger");
const types_1 = require("../../../types");
const errors_1 = require("../../../errors");
const errors_2 = require("./errors");
function handleServiceError(error, operation, logErrors, context) {
    if (error instanceof zod_1.ZodError) {
        const messages = error.issues.map(e => e.message).join(', ');
        if (logErrors) {
            logger_1.logger.warn(`Validation error in ${operation}`, {
                ...context,
                errors: error.issues.length,
                fields: error.issues.map(e => e.path.join('.'))
            });
        }
        return (0, types_1.failure)(messages, 'VALIDATION_ERROR');
    }
    if (error instanceof errors_1.AppError) {
        if (logErrors && error.statusCode >= 500) {
            logger_1.logger.error(`Error in ${operation}`, error.cause, context);
        }
        return (0, types_1.failure)(error.message, (0, errors_2.appErrorToServiceCode)(error));
    }
    if (error instanceof errors_3.ServiceOperationError) {
        if (logErrors && error.code === 'INTERNAL_ERROR') {
            logger_1.logger.error(`Error in ${operation}`, error.cause, context);
        }
        return (0, types_1.failure)(error.message, error.code);
    }
    if (logErrors) {
        logger_1.logger.error(`Error in ${operation}`, error, context);
    }
    const errorMessage = error instanceof Error ? error.message : `Failed to ${operation}`;
    return (0, types_1.failure)(errorMessage, 'INTERNAL_ERROR');
}
const errors_3 = require("./errors");
