"use strict";
/**
 * Service Wrapper - Wrapper Functions
 *
 * Main wrapper functions for service operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.withServiceError = withServiceError;
exports.withServiceErrorSync = withServiceErrorSync;
const types_1 = require("../../../types");
const error_handler_1 = require("./error-handler");
async function withServiceError(operation, fn, options = {}) {
    const { logErrors = true, context } = options;
    try {
        const data = await fn();
        return (0, types_1.success)(data);
    }
    catch (error) {
        return (0, error_handler_1.handleServiceError)(error, operation, logErrors, context);
    }
}
function withServiceErrorSync(operation, fn, options = {}) {
    const { logErrors = true, context } = options;
    try {
        const data = fn();
        return (0, types_1.success)(data);
    }
    catch (error) {
        return (0, error_handler_1.handleServiceError)(error, operation, logErrors, context);
    }
}
