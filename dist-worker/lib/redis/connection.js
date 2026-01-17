"use strict";
/**
 * Redis connection configuration and utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisConfig = getRedisConfig;
exports.parseRedisUrl = parseRedisUrl;
const errors_1 = require("../errors");
/**
 * Parse Redis URL or return individual options
 */
function getRedisConfig(options) {
    if (options.url) {
        return {
            ...parseRedisUrl(options.url),
            keyPrefix: options.keyPrefix,
            maxRetriesPerRequest: options.maxRetriesPerRequest ?? 3,
            enableReadyCheck: options.enableReadyCheck ?? true,
            lazyConnect: options.lazyConnect ?? false,
        };
    }
    return {
        host: options.host ?? 'localhost',
        port: options.port ?? 6379,
        password: options.password,
        db: options.db ?? 0,
        keyPrefix: options.keyPrefix,
        maxRetriesPerRequest: options.maxRetriesPerRequest ?? 3,
        enableReadyCheck: options.enableReadyCheck ?? true,
        lazyConnect: options.lazyConnect ?? false,
        tls: options.tls ? {} : undefined,
    };
}
/**
 * Parse a Redis URL into connection options
 */
function parseRedisUrl(url) {
    try {
        const parsed = new URL(url);
        return {
            host: parsed.hostname,
            port: Number.parseInt(parsed.port) || 6379,
            password: parsed.password || undefined,
            username: parsed.username || undefined,
            db: parsed.pathname ? Number.parseInt(parsed.pathname.slice(1)) || 0 : 0,
            tls: parsed.protocol === 'rediss:' ? {} : undefined,
        };
    }
    catch {
        throw new errors_1.ValidationError(`Invalid Redis URL: ${url}`);
    }
}
