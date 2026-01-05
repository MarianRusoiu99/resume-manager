/**
 * Tracing Module - Tracer
 * 
 * Tracing client for distributed tracing.
 */

import type { Span, SpanContext } from './types';
import { InMemorySpan, type SpanData } from './span-processor';

export class TracingClient {
  private enabled: boolean;
  private currentSpan: Span | null = null;
  private spans: InMemorySpan[] = [];

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  startSpan(name: string, parentContext?: SpanContext): Span {
    if (!this.enabled) {
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

  getCurrentSpan(): Span | null {
    return this.currentSpan;
  }

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

  getSpans(): SpanData[] {
    return this.spans.map(span => span.getData());
  }

  clearSpans(): void {
    this.spans = [];
    this.currentSpan = null;
  }

  extractContext(headers: Record<string, string | undefined>): SpanContext | undefined {
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

  injectContext(span: Span): Record<string, string> {
    const ctx = span.context;
    return {
      traceparent: `00-${ctx.traceId}-${ctx.spanId}-${ctx.traceFlags.toString(16).padStart(2, '0')}`,
    };
  }
}
