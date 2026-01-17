"use strict";
/**
 * Logger Module - Logger Class
 *
 * Main logger implementation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const sanitizer_1 = require("./sanitizer");
class Logger {
    constructor(context = {}, isDevelopment) {
        this.baseContext = {};
        this.baseContext = context;
        // Access NODE_ENV directly to avoid circular dependency with lib/config/env.ts
        this.isDevelopment = isDevelopment ?? (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');
    }
    withContext(context) {
        return new Logger({ ...this.baseContext, ...context });
    }
    forRequest(requestId, userId) {
        return new Logger({
            requestId: requestId || this.generateRequestId(),
            userId,
            ...this.baseContext,
        }, this.isDevelopment);
    }
    info(message, context) {
        this.log('info', message, context);
    }
    warn(message, context) {
        this.log('warn', message, context);
    }
    error(message, error, context) {
        const errorContext = {
            ...context,
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: this.isDevelopment ? error.stack : undefined,
            } : error,
        };
        this.log('error', message, errorContext);
    }
    debug(message, context) {
        if (this.isDevelopment) {
            this.log('debug', message, context);
        }
    }
    log(level, message, context) {
        const timestamp = new Date().toISOString();
        const mergedContext = { ...this.baseContext, ...context };
        const sanitizedContext = (0, sanitizer_1.sanitize)(mergedContext);
        const logEntry = {
            timestamp,
            level,
            message,
            ...sanitizedContext,
        };
        if (this.isDevelopment) {
            const color = this.getColor(level);
            const contextStr = Object.keys(sanitizedContext).length > 0
                ? ` ${JSON.stringify(sanitizedContext)}`
                : '';
            console.log(`${color}[${level.toUpperCase()}]${this.resetColor} ${timestamp} - ${message}${contextStr}`);
        }
        else {
            console.log(JSON.stringify(logEntry));
        }
    }
    generateRequestId() {
        return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    }
    getColor(level) {
        switch (level) {
            case 'info':
                return '\x1b[36m';
            case 'warn':
                return '\x1b[33m';
            case 'error':
                return '\x1b[31m';
            case 'debug':
                return '\x1b[90m';
            default:
                return '';
        }
    }
    get resetColor() {
        return '\x1b[0m';
    }
}
exports.Logger = Logger;
