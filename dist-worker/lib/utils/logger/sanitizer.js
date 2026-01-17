"use strict";
/**
 * Logger Module - Sanitizer
 *
 * Sensitive field sanitization for logs.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitize = sanitize;
const SENSITIVE_FIELDS = [
    'password',
    'apikey',
    'api_key',
    'encryptedkey',
    'encrypted_key',
    'token',
    'secret',
    'authorization',
    'cookie',
    'session',
    'credentials',
    'privatekey',
    'private_key',
];
function sanitize(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitize(item));
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()));
        if (isSensitive) {
            sanitized[key] = '[REDACTED]';
        }
        else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitize(value);
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}
