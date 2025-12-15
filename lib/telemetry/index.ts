/**
 * Telemetry Module
 * 
 * Provides observability through metrics, tracing, and logging.
 * 
 * This module provides interfaces and stubs that can be connected to:
 * - Prometheus/Grafana for metrics
 * - OpenTelemetry/Jaeger for tracing
 * - Sentry for error tracking
 * 
 * @example
 * ```typescript
 * import { metrics, tracing, telemetry } from '@/lib/telemetry';
 * 
 * // Record metrics
 * metrics.increment('resume.generated', { provider: 'openai' });
 * metrics.histogram('ai.latency', durationMs, { model: 'gpt-4' });
 * 
 * // Create traces
 * const span = tracing.startSpan('generateResume');
 * try {
 *   // ... do work
 *   span.setStatus('ok');
 * } finally {
 *   span.end();
 * }
 * 
 * // Or use the telemetry helper
 * const result = await telemetry.trace('generateResume', async (span) => {
 *   span.setAttribute('userId', userId);
 *   return await generateResume(input);
 * });
 * ```
 */

// Metrics
export {
  metrics,
  MetricsClient,
  type Counter,
  type Gauge,
  type Histogram,
  type MetricLabels,
} from './metrics';

// Tracing
export {
  tracing,
  TracingClient,
  type Span,
  type SpanContext,
  type SpanStatus,
  type SpanAttributes,
} from './tracing';

// Telemetry helper
export {
  telemetry,
  TelemetryClient,
  type TelemetryConfig,
  startRequestTelemetry,
} from './client';
