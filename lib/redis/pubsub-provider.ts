/**
 * Redis PubSub Provider
 * 
 * Uses separate subscriber connection as required by Redis
 */

import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { PubSubProvider, MessageHandler } from './types';
import { RedisOptions, getRedisConfig } from './connection';

export class RedisPubSubProvider implements PubSubProvider {
  readonly name = 'redis';
  private readonly publisher: Redis;
  private readonly subscriber: Redis;
  private connected = false;
  private readonly handlers = new Map<string, Set<MessageHandler<unknown>>>();
  private readonly patternHandlers = new Map<string, Set<MessageHandler<unknown>>>();

  constructor(options: RedisOptions = {}) {
    const config = getRedisConfig(options);
    
    // Publisher connection
    this.publisher = new Redis(config);
    this.publisher.on('connect', () => {
      logger.info('Redis publisher connected');
    });
    this.publisher.on('error', (error) => {
      logger.error('Redis publisher error', error);
    });
    
    // Subscriber connection (separate as required by Redis)
    this.subscriber = new Redis(config);
    this.subscriber.on('connect', () => {
      this.connected = true;
      logger.info('Redis subscriber connected');
    });
    this.subscriber.on('error', (error) => {
      logger.error('Redis subscriber error', error);
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
          } catch (error) {
            logger.error('Redis message handler error', error, { channel });
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
          } catch (error) {
            logger.error('Redis pattern handler error', error, { pattern });
          }
        }
      }
    });
  }

  private parseMessage(message: string): unknown {
    try {
      return JSON.parse(message);
    } catch {
      return message;
    }
  }

  isConnected(): boolean {
    return this.connected && this.subscriber.status === 'ready';
  }

  async publish<T>(channel: string, message: T): Promise<void> {
    const serialized = typeof message === 'string' ? message : JSON.stringify(message);
    await this.publisher.publish(channel, serialized);
  }

  async subscribe<T>(channel: string, handler: MessageHandler<T>): Promise<() => void> {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
      await this.subscriber.subscribe(channel);
    }
    
    this.handlers.get(channel)!.add(handler as MessageHandler<unknown>);
    
    return () => {
      const channelHandlers = this.handlers.get(channel);
      if (channelHandlers) {
        channelHandlers.delete(handler as MessageHandler<unknown>);
        if (channelHandlers.size === 0) {
          this.handlers.delete(channel);
          void this.subscriber.unsubscribe(channel);
        }
      }
    };
  }

  async psubscribe<T>(pattern: string, handler: MessageHandler<T>): Promise<() => void> {
    if (!this.patternHandlers.has(pattern)) {
      this.patternHandlers.set(pattern, new Set());
      await this.subscriber.psubscribe(pattern);
    }
    
    this.patternHandlers.get(pattern)!.add(handler as MessageHandler<unknown>);
    
    return () => {
      const patternHandlers = this.patternHandlers.get(pattern);
      if (patternHandlers) {
        patternHandlers.delete(handler as MessageHandler<unknown>);
        if (patternHandlers.size === 0) {
          this.patternHandlers.delete(pattern);
          void this.subscriber.punsubscribe(pattern);
        }
      }
    };
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.publisher.quit(),
      this.subscriber.quit(),
    ]);
  }
}
