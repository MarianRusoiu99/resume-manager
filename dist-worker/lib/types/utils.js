"use strict";
/**
 * Utility types for the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeGet = safeGet;
/**
 * Safely access nested properties that might be undefined
 *
 * @example
 * safeGet(obj, 'a.b.c', 'default')
 */
function safeGet(obj, path, defaultValue) {
    if (!obj)
        return defaultValue;
    const value = path.split('.').reduce((acc, part) => {
        if (acc && typeof acc === 'object') {
            return acc[part];
        }
        return undefined;
    }, obj);
    return value ?? defaultValue;
}
