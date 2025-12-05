/**
 * Tracing Module
 * 
 * Provides distributed tracing for request tracking.
 * 
 * Current implementation: In-memory stub (logs spans)
 * Production: Connect to OpenTelemetry, Jaeger, or Zipkin
 */

import { logger } from '@/lib/utils/logger';

/**
 * Span status
 */
export type SpanStatus = 'ok' | 'error' | 'unset';

/**
 * Span attributes
 */
export type SpanAttributes = Record<string, string | number | boolean | undefined>;

/**
 * Span context for propagation
 */
export interface SpanContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
}

/**
 * Span interface
 */
export interface Span {
  /** Span name */
  readonly name: string;
  /** Span context */
  readonly context: SpanContext;
  /** Set an attribute */
  setAttribute(key: string, value: string | number | boolean): void;
  /** Set multiple attributes */
  setAttributes(attributes: SpanAttributes): void;
  /** Add an event to the span */
  addEvent(name: string, attributes?: SpanAttributes): void;
  /** Set span status */
  setStatus(status: SpanStatus, message?: string): void;
  /** Record an exception */
  recordException(error: Error): void;
  /** End the span */
  end(): void;
}

/**
 * Generate a random ID for tracing
 */
function generateId(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * In-memory span implementation
 */
class InMemorySpan implements Span {
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
      traceFlags: 1, // Sampled
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

  /**
   * Get span data (for debugging/export)
   */
  getData(): {
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
  } {
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

/**
 * Tracing client
 */
export class TracingClient {
  private enabled: boolean;
  private currentSpan: Span | null = null;
  private spans: InMemorySpan[] = [];

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  /**
   * Start a new span
   */
  startSpan(name: string, parentContext?: SpanContext): Span {
    if (!this.enabled) {
      // Return a no-op span
      return {
        name,
        context: { traceId: '', spanId: '', traceFlags: 0 },
        setAttribute: () => {},
        setAttributes: () => {},
        addEvent: () => {},
        setStatus: () => {},
        recordException: () => {},
        end: () => {},
      };
    }

    const span = new InMemorySpan(name, parentContext || this.currentSpan?.context);
    this.spans.push(span);
    this.currentSpan = span;
    return span;
  }

  /**
   * Get current active span
   */
  getCurrentSpan(): Span | null {
    return this.currentSpan;
  }

  /**
   * Execute a function within a span
   */
  async trace<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    parentContext?: SpanContext
  ): Promise<T> {
    const span = this.startSpan(name, parentContext);
    
    try {
      const result = await fn(span);
      span.setStatus('ok');
      return result;
    } catch (error) {
      if (error instanceof Error) {
        span.recordException(error);
      } else {
        span.setStatus('error', String(error));
      }
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Synchronous version of trace
   */
  traceSync<T>(
    name: string,
    fn: (span: Span) => T,
    parentContext?: SpanContext
  ): T {
    const span = this.startSpan(name, parentContext);
    
    try {
      const result = fn(span);
      span.setStatus('ok');
      return result;
    } catch (error) {
      if (error instanceof Error) {
        span.recordException(error);
      } else {
        span.setStatus('error', String(error));
      }
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Get all recorded spans (for debugging)
   */
  getSpans(): Array<ReturnType<InMemorySpan['getData']>> {
    return this.spans.map(span => span.getData());
  }

  /**
   * Clear recorded spans
   */
  clearSpans(): void {
    this.spans = [];
    this.currentSpan = null;
  }

  /**
   * Extract trace context from headers
   */
  extractContext(headers: Record<string, string | undefined>): SpanContext | undefined {
    // W3C Trace Context format
    const traceparent = headers['traceparent'];
    if (!traceparent) return undefined;

    const parts = traceparent.split('-');
    if (parts.length !== 4) return undefined;

    return {
      traceId: parts[1],
      spanId: parts[2],
      traceFlags: parseInt(parts[3], 16),
    };
  }

  /**
   * Inject trace context into headers
   */
  injectContext(span: Span): Record<string, string> {
    const ctx = span.context;
    return {
      traceparent: `00-${ctx.traceId}-${ctx.spanId}-${ctx.traceFlags.toString(16).padStart(2, '0')}`,
    };
  }
}

/**
 * Global tracing instance
 */
export const tracing = new TracingClient(process.env.NODE_ENV !== 'test');
