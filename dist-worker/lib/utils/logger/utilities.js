"use strict";
/**
 * Logger Module - Utilities
 *
 * Utility functions for timing and logging.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.withTiming = withTiming;
exports.createTimedLogger = createTimedLogger;
const logger_1 = require("./logger");
// Create logger with isDevelopment flag to avoid circular dependency with env.ts
const isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
exports.logger = new logger_1.Logger({}, isDevelopment);
async function withTiming(operation, fn, context) {
    const startTime = Date.now();
    try {
        const result = await fn();
        const duration = Date.now() - startTime;
        exports.logger.info(`${operation} completed`, { ...context, duration });
        return result;
    }
    catch (error) {
        const duration = Date.now() - startTime;
        exports.logger.error(`${operation} failed`, error, { ...context, duration });
        throw error;
    }
}
function createTimedLogger(operation, context) {
    const startTime = Date.now();
    const log = exports.logger.withContext({ operation, ...context });
    return {
        info: (message, extraContext) => {
            log.info(message, { ...extraContext, elapsed: Date.now() - startTime });
        },
        warn: (message, extraContext) => {
            log.warn(message, { ...extraContext, elapsed: Date.now() - startTime });
        },
        error: (message, error, extraContext) => {
            log.error(message, error, { ...extraContext, elapsed: Date.now() - startTime });
        },
        complete: (message, extraContext) => {
            log.info(message || `${operation} completed`, {
                ...extraContext,
                duration: Date.now() - startTime
            });
        },
    };
}
