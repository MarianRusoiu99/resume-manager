/**
 * Tracing Module - Span Processor
 * 
 * In-memory span implementation.
 */

import { logger } from '@/lib/utils/logger';
import type { Span, SpanContext, SpanStatus, SpanAttributes } from './types';

function generateId(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export interface SpanData {
  name: string;
  context: SpanContext;
  parentContext?: SpanContext;
  startTime: number;
  endTime?: number;
  duration?: number;
  attributes: SpanAttributes;
  events: Array<{ name: string; timestamp: number; attributes?: SpanAttributes }>;
  status: SpanStatus;
  statusMessage?: string;
}

export class InMemorySpan implements Span {
  readonly name: string;
  readonly context: SpanContext;
  
  private attributes: SpanAttributes = {};
  private events: Array<{ name: string; timestamp: number; attributes?: SpanAttributes }> = [];
  private status: SpanStatus = 'unset';
  private statusMessage?: string;
  private startTime: number;
  private endTime?: number;
  private parentContext?: SpanContext;

  constructor(name: string, parentContext?: SpanContext) {
    this.name = name;
    this.parentContext = parentContext;
    this.startTime = performance.now();
    
    this.context = {
      traceId: parentContext?.traceId || generateId(32),
      spanId: generateId(16),
      traceFlags: 1,
    };

    logger.debug(`[Trace] Started span: ${name}`, {
      traceId: this.context.traceId,
      spanId: this.context.spanId,
      parentSpanId: parentContext?.spanId,
    });
  }

  setAttribute(key: string, value: string | number | boolean): void {
    this.attributes[key] = value;
  }

  setAttributes(attributes: SpanAttributes): void {
    Object.assign(this.attributes, attributes);
  }

  addEvent(name: string, attributes?: SpanAttributes): void {
    this.events.push({
      name,
      timestamp: performance.now(),
      attributes,
    });
  }

  setStatus(status: SpanStatus, message?: string): void {
    this.status = status;
    this.statusMessage = message;
  }

  recordException(error: Error): void {
    this.addEvent('exception', {
      'exception.type': error.name,
      'exception.message': error.message,
      'exception.stacktrace': error.stack,
    });
    this.setStatus('error', error.message);
  }

  end(): void {
    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;

    logger.debug(`[Trace] Ended span: ${this.name}`, {
      traceId: this.context.traceId,
      spanId: this.context.spanId,
      durationMs: duration.toFixed(2),
      status: this.status,
      attributes: this.attributes,
      eventCount: this.events.length,
    });
  }

  getData(): SpanData {
    return {
      name: this.name,
      context: this.context,
      parentContext: this.parentContext,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.endTime ? this.endTime - this.startTime : undefined,
      attributes: this.attributes,
      events: this.events,
      status: this.status,
      statusMessage: this.statusMessage,
    };
  }
}
