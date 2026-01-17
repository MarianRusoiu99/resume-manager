"use strict";
/**
 * Service Wrapper - Utilities
 *
 * Additional utility functions for service operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runParallel = runParallel;
exports.chainOperations = chainOperations;
async function runParallel(...operations) {
    return Promise.all(operations);
}
async function chainOperations(...operations) {
    let result = (0, types_1.success)(undefined);
    for (const operation of operations) {
        if (!result.success)
            return result;
        result = await operation(result.data);
    }
    return result;
}
const types_1 = require("../../../types");
