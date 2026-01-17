"use strict";
/**
 * Redis Cache Provider
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheProvider = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
const connection_1 = require("./connection");
class RedisCacheProvider {
    constructor(options = {}) {
        this.name = 'redis';
        this.connected = false;
        const config = (0, connection_1.getRedisConfig)(options);
        this.client = new ioredis_1.default(config);
        this.client.on('connect', () => {
            this.connected = true;
            logger_1.logger.info('Redis cache client connected');
        });
        this.client.on('error', (error) => {
            logger_1.logger.error('Redis cache client error', error);
        });
        this.client.on('close', () => {
            this.connected = false;
            logger_1.logger.info('Redis cache client disconnected');
        });
    }
    isConnected() {
        return this.connected && this.client.status === 'ready';
    }
    async get(key) {
        const value = await this.client.get(key);
        if (value === null)
            return null;
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    async set(key, value, ttlSeconds) {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        if (ttlSeconds) {
            await this.client.setex(key, ttlSeconds, serialized);
        }
        else {
            await this.client.set(key, serialized);
        }
    }
    async delete(key) {
        const result = await this.client.del(key);
        return result > 0;
    }
    async exists(key) {
        const result = await this.client.exists(key);
        return result > 0;
    }
    async expire(key, ttlSeconds) {
        const result = await this.client.expire(key, ttlSeconds);
        return result === 1;
    }
    async ttl(key) {
        return this.client.ttl(key);
    }
    async incr(key) {
        return this.client.incr(key);
    }
    async decr(key) {
        return this.client.decr(key);
    }
    async mget(keys) {
        if (keys.length === 0)
            return [];
        const values = await this.client.mget(...keys);
        return values.map((value) => {
            if (value === null)
                return null;
            try {
                return JSON.parse(value);
            }
            catch {
                return value;
            }
        });
    }
    async mset(entries) {
        if (entries.length === 0)
            return;
        const pipeline = this.client.pipeline();
        for (const { key, value, ttlSeconds } of entries) {
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            if (ttlSeconds) {
                pipeline.setex(key, ttlSeconds, serialized);
            }
            else {
                pipeline.set(key, serialized);
            }
        }
        await pipeline.exec();
    }
    async deletePattern(pattern) {
        let cursor = '0';
        let deleted = 0;
        do {
            const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                deleted += await this.client.del(...keys);
            }
        } while (cursor !== '0');
        return deleted;
    }
    async disconnect() {
        await this.client.quit();
    }
    /**
     * Get the underlying Redis client for advanced operations
     */
    getClient() {
        return this.client;
    }
}
exports.RedisCacheProvider = RedisCacheProvider;
