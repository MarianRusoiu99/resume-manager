"use strict";
/**
 * Redis/Cache Client Factory
 *
 * Creates and manages the appropriate cache/pubsub provider based on configuration.
 * Supports Redis (production) and in-memory (development/fallback).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCacheProvider = getCacheProvider;
exports.getPubSubProvider = getPubSubProvider;
exports.getRedisClient = getRedisClient;
exports.resetProviders = resetProviders;
exports.checkRedisHealth = checkRedisHealth;
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const memory_provider_1 = require("./memory-provider");
const redis_provider_1 = require("./redis-provider");
/**
 * Singleton instances
 */
let cacheInstance = null;
let pubsubInstance = null;
let combinedInstance = null;
/**
 * Get default configuration from environment
 */
function getDefaultConfig() {
    return {
        provider: config_1.env.hasRedis ? 'redis' : 'memory',
        redis: config_1.env.REDIS_URL ? { url: config_1.env.REDIS_URL } : undefined,
        keyPrefix: config_1.env.REDIS_KEY_PREFIX,
    };
}
/**
 * Determine which provider to use
 */
function resolveProvider(config) {
    if (config.provider === 'redis')
        return 'redis';
    if (config.provider === 'memory')
        return 'memory';
    // Auto-detect
    return config_1.env.hasRedis ? 'redis' : 'memory';
}
/**
 * Get the cache provider instance (singleton)
 */
function getCacheProvider(config) {
    if (cacheInstance)
        return cacheInstance;
    const mergedConfig = { ...getDefaultConfig(), ...config };
    const providerType = resolveProvider(mergedConfig);
    if (providerType === 'redis') {
        cacheInstance = new redis_provider_1.RedisCacheProvider({
            ...mergedConfig.redis,
            keyPrefix: mergedConfig.keyPrefix,
        });
        logger_1.logger.info('Using Redis cache provider');
    }
    else {
        cacheInstance = new memory_provider_1.MemoryCacheProvider();
        logger_1.logger.warn('Using in-memory cache provider (not suitable for multi-instance deployments)');
    }
    return cacheInstance;
}
/**
 * Get the pubsub provider instance (singleton)
 */
function getPubSubProvider(config) {
    if (pubsubInstance)
        return pubsubInstance;
    const mergedConfig = { ...getDefaultConfig(), ...config };
    const providerType = resolveProvider(mergedConfig);
    if (providerType === 'redis') {
        pubsubInstance = new redis_provider_1.RedisPubSubProvider({
            ...mergedConfig.redis,
            keyPrefix: mergedConfig.keyPrefix,
        });
        logger_1.logger.info('Using Redis pubsub provider');
    }
    else {
        pubsubInstance = new memory_provider_1.MemoryPubSubProvider();
        logger_1.logger.warn('Using in-memory pubsub provider (not suitable for multi-instance deployments)');
    }
    return pubsubInstance;
}
/**
 * Get a combined cache + pubsub provider instance (singleton)
 */
function getRedisClient(config) {
    if (combinedInstance)
        return combinedInstance;
    const mergedConfig = { ...getDefaultConfig(), ...config };
    const providerType = resolveProvider(mergedConfig);
    if (providerType === 'redis') {
        combinedInstance = new redis_provider_1.RedisProvider({
            ...mergedConfig.redis,
            keyPrefix: mergedConfig.keyPrefix,
        });
        logger_1.logger.info('Using Redis provider for cache and pubsub');
    }
    else {
        // Create a combined memory provider
        const cache = new memory_provider_1.MemoryCacheProvider();
        const pubsub = new memory_provider_1.MemoryPubSubProvider();
        combinedInstance = {
            name: 'memory',
            isConnected: () => true,
            // Cache
            get: cache.get.bind(cache),
            set: cache.set.bind(cache),
            delete: cache.delete.bind(cache),
            exists: cache.exists.bind(cache),
            expire: cache.expire.bind(cache),
            ttl: cache.ttl.bind(cache),
            incr: cache.incr.bind(cache),
            decr: cache.decr.bind(cache),
            mget: cache.mget.bind(cache),
            mset: cache.mset.bind(cache),
            deletePattern: cache.deletePattern.bind(cache),
            // PubSub
            publish: pubsub.publish.bind(pubsub),
            subscribe: pubsub.subscribe.bind(pubsub),
            psubscribe: pubsub.psubscribe.bind(pubsub),
            // Disconnect both
            disconnect: async () => {
                await Promise.all([cache.disconnect(), pubsub.disconnect()]);
            },
        };
        logger_1.logger.warn('Using in-memory provider for cache and pubsub (not suitable for multi-instance deployments)');
    }
    return combinedInstance;
}
/**
 * Reset all singleton instances (useful for testing)
 */
async function resetProviders() {
    const disconnectPromises = [];
    if (cacheInstance) {
        disconnectPromises.push(cacheInstance.disconnect());
        cacheInstance = null;
    }
    if (pubsubInstance) {
        disconnectPromises.push(pubsubInstance.disconnect());
        pubsubInstance = null;
    }
    if (combinedInstance) {
        disconnectPromises.push(combinedInstance.disconnect());
        combinedInstance = null;
    }
    await Promise.all(disconnectPromises);
}
/**
 * Health check for Redis connection
 */
async function checkRedisHealth() {
    const client = getRedisClient();
    if (!client.isConnected()) {
        return {
            connected: false,
            provider: client.name,
            error: 'Not connected',
        };
    }
    try {
        const start = Date.now();
        await client.set('__health_check__', 'ok', 1);
        const latencyMs = Date.now() - start;
        return {
            connected: true,
            provider: client.name,
            latencyMs,
        };
    }
    catch (error) {
        return {
            connected: false,
            provider: client.name,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
