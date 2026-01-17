"use strict";
/**
 * In-Memory PubSub and Cache Provider
 *
 * Fallback provider for development or when Redis is unavailable.
 * NOT suitable for multi-instance deployments.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryProvider = exports.MemoryPubSubProvider = exports.MemoryCacheProvider = void 0;
const node_events_1 = require("node:events");
/**
 * In-memory cache implementation
 */
class MemoryCacheProvider {
    constructor() {
        this.name = 'memory';
        this.cache = new Map();
        this.cleanupInterval = null;
        // Periodic cleanup of expired entries
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
    isConnected() {
        return true; // Always connected
    }
    isExpired(entry) {
        return entry.expiresAt !== null && Date.now() > entry.expiresAt;
    }
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt !== null && now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }
    async get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (this.isExpired(entry)) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }
    async set(key, value, ttlSeconds) {
        const entry = {
            value,
            expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
        };
        this.cache.set(key, entry);
    }
    async delete(key) {
        return this.cache.delete(key);
    }
    async exists(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        if (this.isExpired(entry)) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    async expire(key, ttlSeconds) {
        const entry = this.cache.get(key);
        if (!entry || this.isExpired(entry))
            return false;
        entry.expiresAt = Date.now() + ttlSeconds * 1000;
        return true;
    }
    async ttl(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return -2;
        if (entry.expiresAt === null)
            return -1;
        const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
        return remaining > 0 ? remaining : -2;
    }
    async incr(key) {
        const current = await this.get(key);
        const newValue = (current ?? 0) + 1;
        await this.set(key, newValue);
        return newValue;
    }
    async decr(key) {
        const current = await this.get(key);
        const newValue = (current ?? 0) - 1;
        await this.set(key, newValue);
        return newValue;
    }
    async mget(keys) {
        return Promise.all(keys.map((key) => this.get(key)));
    }
    async mset(entries) {
        for (const { key, value, ttlSeconds } of entries) {
            await this.set(key, value, ttlSeconds);
        }
    }
    async deletePattern(pattern) {
        // Convert glob pattern to regex
        const regex = new RegExp('^' + pattern.replaceAll('*', '.*').replaceAll('?', '.') + '$');
        let count = 0;
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
                count++;
            }
        }
        return count;
    }
    async disconnect() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.cache.clear();
    }
}
exports.MemoryCacheProvider = MemoryCacheProvider;
/**
 * In-memory PubSub implementation using Node.js EventEmitter
 */
class MemoryPubSubProvider {
    constructor() {
        this.name = 'memory';
        this.emitter = new node_events_1.EventEmitter();
        // Increase max listeners for high-traffic scenarios
        this.emitter.setMaxListeners(100);
    }
    isConnected() {
        return true; // Always connected
    }
    async publish(channel, message) {
        this.emitter.emit(channel, message);
        // Also emit to pattern subscribers
        this.emitter.emit('__pattern__', channel, message);
    }
    async subscribe(channel, handler) {
        const wrappedHandler = (message) => handler(channel, message);
        this.emitter.on(channel, wrappedHandler);
        return () => {
            this.emitter.off(channel, wrappedHandler);
        };
    }
    async psubscribe(pattern, handler) {
        // Convert glob pattern to regex
        const regex = new RegExp('^' + pattern.replaceAll('*', '.*').replaceAll('?', '.') + '$');
        const patternHandler = (channel, message) => {
            if (regex.test(channel)) {
                handler(channel, message);
            }
        };
        this.emitter.on('__pattern__', patternHandler);
        return () => {
            this.emitter.off('__pattern__', patternHandler);
        };
    }
    async disconnect() {
        this.emitter.removeAllListeners();
    }
}
exports.MemoryPubSubProvider = MemoryPubSubProvider;
/**
 * Combined in-memory provider
 */
class MemoryProvider {
    constructor() {
        this.name = 'memory';
        this.cacheProvider = new MemoryCacheProvider();
        this.pubsubProvider = new MemoryPubSubProvider();
    }
    isConnected() {
        return true;
    }
    // Cache methods
    get(key) {
        return this.cacheProvider.get(key);
    }
    set(key, value, ttlSeconds) {
        return this.cacheProvider.set(key, value, ttlSeconds);
    }
    delete(key) {
        return this.cacheProvider.delete(key);
    }
    exists(key) {
        return this.cacheProvider.exists(key);
    }
    expire(key, ttlSeconds) {
        return this.cacheProvider.expire(key, ttlSeconds);
    }
    ttl(key) {
        return this.cacheProvider.ttl(key);
    }
    incr(key) {
        return this.cacheProvider.incr(key);
    }
    decr(key) {
        return this.cacheProvider.decr(key);
    }
    mget(keys) {
        return this.cacheProvider.mget(keys);
    }
    mset(entries) {
        return this.cacheProvider.mset(entries);
    }
    deletePattern(pattern) {
        return this.cacheProvider.deletePattern(pattern);
    }
    // PubSub methods
    publish(channel, message) {
        return this.pubsubProvider.publish(channel, message);
    }
    subscribe(channel, handler) {
        return this.pubsubProvider.subscribe(channel, handler);
    }
    psubscribe(pattern, handler) {
        return this.pubsubProvider.psubscribe(pattern, handler);
    }
    async disconnect() {
        await Promise.all([
            this.cacheProvider.disconnect(),
            this.pubsubProvider.disconnect(),
        ]);
    }
}
exports.MemoryProvider = MemoryProvider;
