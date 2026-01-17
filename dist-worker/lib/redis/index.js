"use strict";
/**
 * Redis/Cache Module
 *
 * Provides abstracted cache and pub/sub functionality with swappable providers.
 *
 * @example
 * // Get the cache client
 * import { getCacheProvider, getPubSubProvider, getRedisClient } from '@/lib/redis';
 *
 * // Cache operations
 * const cache = getCacheProvider();
 * await cache.set('key', { data: 'value' }, 300); // TTL 5 minutes
 * const data = await cache.get('key');
 *
 * // PubSub operations
 * const pubsub = getPubSubProvider();
 * await pubsub.subscribe('notifications:user123', (channel, message) => {
 *   console.log('Received:', message);
 * });
 * await pubsub.publish('notifications:user123', { type: 'NEW_MESSAGE' });
 *
 * // Combined client
 * const redis = getRedisClient();
 * // Has both cache and pubsub methods
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRedisHealth = exports.resetProviders = exports.getRedisClient = exports.getPubSubProvider = exports.getCacheProvider = exports.RedisProvider = exports.RedisPubSubProvider = exports.RedisCacheProvider = exports.MemoryProvider = exports.MemoryPubSubProvider = exports.MemoryCacheProvider = void 0;
// Providers (for direct instantiation if needed)
var memory_provider_1 = require("./memory-provider");
Object.defineProperty(exports, "MemoryCacheProvider", { enumerable: true, get: function () { return memory_provider_1.MemoryCacheProvider; } });
Object.defineProperty(exports, "MemoryPubSubProvider", { enumerable: true, get: function () { return memory_provider_1.MemoryPubSubProvider; } });
Object.defineProperty(exports, "MemoryProvider", { enumerable: true, get: function () { return memory_provider_1.MemoryProvider; } });
var redis_provider_1 = require("./redis-provider");
Object.defineProperty(exports, "RedisCacheProvider", { enumerable: true, get: function () { return redis_provider_1.RedisCacheProvider; } });
Object.defineProperty(exports, "RedisPubSubProvider", { enumerable: true, get: function () { return redis_provider_1.RedisPubSubProvider; } });
Object.defineProperty(exports, "RedisProvider", { enumerable: true, get: function () { return redis_provider_1.RedisProvider; } });
// Factory functions (recommended)
var client_1 = require("./client");
Object.defineProperty(exports, "getCacheProvider", { enumerable: true, get: function () { return client_1.getCacheProvider; } });
Object.defineProperty(exports, "getPubSubProvider", { enumerable: true, get: function () { return client_1.getPubSubProvider; } });
Object.defineProperty(exports, "getRedisClient", { enumerable: true, get: function () { return client_1.getRedisClient; } });
Object.defineProperty(exports, "resetProviders", { enumerable: true, get: function () { return client_1.resetProviders; } });
Object.defineProperty(exports, "checkRedisHealth", { enumerable: true, get: function () { return client_1.checkRedisHealth; } });
