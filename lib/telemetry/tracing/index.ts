/**
 * Tracing Module
 * 
 * Provides distributed tracing for request tracking.
 * 
 * Current implementation: In-memory stub (logs spans)
 * Production: Connect to OpenTelemetry, Jaeger, or Zipkin
 */

export type { SpanStatus, SpanAttributes, SpanContext, Span } from './types';
export type { SpanData } from './span-processor';
export { InMemorySpan } from './span-processor';
export { TracingClient } from './tracer';

import { env } from '@/lib/config';
import { TracingClient } from './tracer';

export const tracing = new TracingClient(!env.isTest);
