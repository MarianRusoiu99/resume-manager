"use strict";
/**
 * Redis Provider Implementation
 *
 * Production-ready Redis provider using ioredis.
 * Supports both caching and pub/sub functionality.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisProvider = void 0;
const cache_provider_1 = require("./cache-provider");
const pubsub_provider_1 = require("./pubsub-provider");
__exportStar(require("./types"), exports);
__exportStar(require("./connection"), exports);
__exportStar(require("./cache-provider"), exports);
__exportStar(require("./pubsub-provider"), exports);
/**
 * Combined Redis provider for both caching and pub/sub
 */
class RedisProvider {
    constructor(options = {}) {
        this.name = 'redis';
        // Cache methods
        this.get = (key) => this.cacheProvider.get(key);
        this.set = (key, value, ttlSeconds) => this.cacheProvider.set(key, value, ttlSeconds);
        this.delete = (key) => this.cacheProvider.delete(key);
        this.exists = (key) => this.cacheProvider.exists(key);
        this.expire = (key, ttlSeconds) => this.cacheProvider.expire(key, ttlSeconds);
        this.ttl = (key) => this.cacheProvider.ttl(key);
        this.incr = (key) => this.cacheProvider.incr(key);
        this.decr = (key) => this.cacheProvider.decr(key);
        this.mget = (keys) => this.cacheProvider.mget(keys);
        this.mset = (entries) => this.cacheProvider.mset(entries);
        this.deletePattern = (pattern) => this.cacheProvider.deletePattern(pattern);
        // PubSub methods
        this.publish = (channel, message) => this.pubsubProvider.publish(channel, message);
        this.subscribe = (channel, handler) => this.pubsubProvider.subscribe(channel, handler);
        this.psubscribe = (pattern, handler) => this.pubsubProvider.psubscribe(pattern, handler);
        this.cacheProvider = new cache_provider_1.RedisCacheProvider(options);
        this.pubsubProvider = new pubsub_provider_1.RedisPubSubProvider(options);
    }
    isConnected() {
        return this.cacheProvider.isConnected() && this.pubsubProvider.isConnected();
    }
    async disconnect() {
        await Promise.all([
            this.cacheProvider.disconnect(),
            this.pubsubProvider.disconnect(),
        ]);
    }
    /**
     * Get the underlying cache client for advanced operations
     */
    getCacheClient() {
        return this.cacheProvider.getClient();
    }
}
exports.RedisProvider = RedisProvider;
