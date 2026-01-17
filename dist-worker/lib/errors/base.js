"use strict";
/**
 * Base Application Error Class
 *
 * This file is separated to prevent circular dependencies.
 * All error classes should extend from AppError defined here.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.isAppError = isAppError;
/**
 * Base application error class
 */
class AppError extends Error {
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = this.constructor.name;
        // Maintains proper stack trace for where error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    /**
     * Convert to JSON for API responses
     */
    toJSON() {
        return {
            error: this.message,
            code: this.code,
            name: this.name,
        };
    }
}
exports.AppError = AppError;
/**
 * Type guard to check if an error is an AppError
 */
function isAppError(error) {
    return error instanceof AppError;
}
