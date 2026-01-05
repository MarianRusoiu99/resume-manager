/**
 * Tracing types
 */

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
