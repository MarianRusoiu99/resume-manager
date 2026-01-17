"use strict";
/**
 * Redis PubSub Provider
 *
 * Uses separate subscriber connection as required by Redis
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisPubSubProvider = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
const connection_1 = require("./connection");
class RedisPubSubProvider {
    constructor(options = {}) {
        this.name = 'redis';
        this.connected = false;
        this.handlers = new Map();
        this.patternHandlers = new Map();
        const config = (0, connection_1.getRedisConfig)(options);
        // Publisher connection
        this.publisher = new ioredis_1.default(config);
        this.publisher.on('connect', () => {
            logger_1.logger.info('Redis publisher connected');
        });
        this.publisher.on('error', (error) => {
            logger_1.logger.error('Redis publisher error', error);
        });
        // Subscriber connection (separate as required by Redis)
        this.subscriber = new ioredis_1.default(config);
        this.subscriber.on('connect', () => {
            this.connected = true;
            logger_1.logger.info('Redis subscriber connected');
        });
        this.subscriber.on('error', (error) => {
            logger_1.logger.error('Redis subscriber error', error);
        });
        this.subscriber.on('close', () => {
            this.connected = false;
        });
        // Handle incoming messages
        this.subscriber.on('message', (channel, message) => {
            const channelHandlers = this.handlers.get(channel);
            if (channelHandlers) {
                const parsed = this.parseMessage(message);
                for (const handler of channelHandlers) {
                    try {
                        handler(channel, parsed);
                    }
                    catch (error) {
                        logger_1.logger.error('Redis message handler error', error, { channel });
                    }
                }
            }
        });
        // Handle pattern messages
        this.subscriber.on('pmessage', (pattern, channel, message) => {
            const patternHandlers = this.patternHandlers.get(pattern);
            if (patternHandlers) {
                const parsed = this.parseMessage(message);
                for (const handler of patternHandlers) {
                    try {
                        handler(channel, parsed);
                    }
                    catch (error) {
                        logger_1.logger.error('Redis pattern handler error', error, { pattern });
                    }
                }
            }
        });
    }
    parseMessage(message) {
        try {
            return JSON.parse(message);
        }
        catch {
            return message;
        }
    }
    isConnected() {
        return this.connected && this.subscriber.status === 'ready';
    }
    async publish(channel, message) {
        const serialized = typeof message === 'string' ? message : JSON.stringify(message);
        await this.publisher.publish(channel, serialized);
    }
    async subscribe(channel, handler) {
        if (!this.handlers.has(channel)) {
            this.handlers.set(channel, new Set());
            await this.subscriber.subscribe(channel);
        }
        this.handlers.get(channel).add(handler);
        return () => {
            const channelHandlers = this.handlers.get(channel);
            if (channelHandlers) {
                channelHandlers.delete(handler);
                if (channelHandlers.size === 0) {
                    this.handlers.delete(channel);
                    void this.subscriber.unsubscribe(channel);
                }
            }
        };
    }
    async psubscribe(pattern, handler) {
        if (!this.patternHandlers.has(pattern)) {
            this.patternHandlers.set(pattern, new Set());
            await this.subscriber.psubscribe(pattern);
        }
        this.patternHandlers.get(pattern).add(handler);
        return () => {
            const patternHandlers = this.patternHandlers.get(pattern);
            if (patternHandlers) {
                patternHandlers.delete(handler);
                if (patternHandlers.size === 0) {
                    this.patternHandlers.delete(pattern);
                    void this.subscriber.punsubscribe(pattern);
                }
            }
        };
    }
    async disconnect() {
        await Promise.all([
            this.publisher.quit(),
            this.subscriber.quit(),
        ]);
    }
}
exports.RedisPubSubProvider = RedisPubSubProvider;
