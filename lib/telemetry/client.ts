/**
 * Telemetry Client
 * 
 * High-level interface combining metrics and tracing.
 */

import { metrics, MetricsClient, AppMetrics } from './metrics';
import { tracing, TracingClient, Span, SpanContext } from './tracing';
import { logger } from '@/lib/utils/logger';

/**
 * Telemetry configuration
 */
export interface TelemetryConfig {
  /** Enable metrics collection */
  metricsEnabled?: boolean;
  /** Enable tracing */
  tracingEnabled?: boolean;
  /** Service name for tracing */
  serviceName?: string;
  /** Environment (development, staging, production) */
  environment?: string;
}

/**
 * Telemetry client combining metrics and tracing
 */
export class TelemetryClient {
  readonly metrics: MetricsClient;
  readonly tracing: TracingClient;
  private config: Required<TelemetryConfig>;

  constructor(config: TelemetryConfig = {}) {
    this.config = {
      metricsEnabled: config.metricsEnabled ?? true,
      tracingEnabled: config.tracingEnabled ?? true,
      serviceName: config.serviceName ?? 'resume-optimizer',
      environment: config.environment ?? process.env.NODE_ENV ?? 'development',
    };

    this.metrics = metrics;
    this.tracing = tracing;
  }

  /**
   * Trace an async operation with metrics
   */
  async trace<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    options: {
      parentContext?: SpanContext;
      labels?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const timer = this.metrics.startTimer(`${name}_duration_ms`, options.labels);
    this.metrics.increment(`${name}_total`, options.labels);

    try {
      const result = await this.tracing.trace(name, fn, options.parentContext);
      this.metrics.increment(`${name}_success`, options.labels);
      return result;
    } catch (error) {
      this.metrics.increment(`${name}_error`, options.labels);
      throw error;
    } finally {
      timer();
    }
  }

  /**
   * Record an HTTP request
   */
  recordHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number
  ): void {
    const labels = { method, path, status: statusCode.toString() };
    
    AppMetrics.httpRequestsTotal.inc(labels);
    AppMetrics.httpRequestDuration.observe(durationMs, labels);
    
    if (statusCode >= 400) {
      AppMetrics.httpRequestErrors.inc(labels);
    }
  }

  /**
   * Record an AI generation
   */
  recordAIGeneration(
    provider: string,
    model: string,
    success: boolean,
    durationMs: number,
    tokensUsed?: number
  ): void {
    const labels = { provider, model };
    
    AppMetrics.aiGenerationsTotal.inc(labels);
    AppMetrics.aiGenerationDuration.observe(durationMs, labels);
    
    if (tokensUsed) {
      AppMetrics.aiTokensUsed.add(tokensUsed, labels);
    }
    
    if (!success) {
      AppMetrics.aiErrors.inc(labels);
    }
  }

  /**
   * Record a resume generation
   */
  recordResumeGeneration(templateId?: string): void {
    AppMetrics.resumesGenerated.inc({ template: templateId ?? 'default' });
  }

  /**
   * Record a cover letter generation
   */
  recordCoverLetterGeneration(): void {
    AppMetrics.coverLettersGenerated.inc();
  }

  /**
   * Record a PDF export
   */
  recordPdfExport(templateId?: string): void {
    AppMetrics.pdfExports.inc({ template: templateId ?? 'default' });
  }

  /**
   * Record a cache operation
   */
  recordCacheOperation(hit: boolean, cache: string = 'default'): void {
    if (hit) {
      AppMetrics.cacheHits.inc({ cache });
    } else {
      AppMetrics.cacheMisses.inc({ cache });
    }
  }

  /**
   * Record circuit breaker state
   */
  recordCircuitBreakerState(name: string, state: 'closed' | 'open' | 'half-open'): void {
    const stateValue = state === 'closed' ? 0 : state === 'half-open' ? 1 : 2;
    AppMetrics.circuitBreakerState.set(stateValue, { circuit: name });
  }

  /**
   * Record circuit breaker trip
   */
  recordCircuitBreakerTrip(name: string): void {
    AppMetrics.circuitBreakerTrips.inc({ circuit: name });
  }

  /**
   * Get all telemetry data (for debugging)
   */
  getData(): {
    metrics: ReturnType<MetricsClient['getMetrics']>;
    spans: ReturnType<TracingClient['getSpans']>;
    config: Required<TelemetryConfig>;
  } {
    return {
      metrics: this.metrics.getMetrics(),
      spans: this.tracing.getSpans(),
      config: this.config,
    };
  }

  /**
   * Reset all telemetry data
   */
  reset(): void {
    this.metrics.reset();
    this.tracing.clearSpans();
  }
}

/**
 * Global telemetry instance
 */
export const telemetry = new TelemetryClient({
  serviceName: 'resume-optimizer',
  environment: process.env.NODE_ENV,
});

/**
 * Middleware helper for request telemetry
 * 
 * @example
 * ```typescript
 * // In API route
 * const stopTimer = startRequestTelemetry(request);
 * try {
 *   // Handle request
 *   return response;
 * } finally {
 *   stopTimer(response.status);
 * }
 * ```
 */
export function startRequestTelemetry(
  request: Request
): (statusCode: number) => void {
  const url = new URL(request.url);
  const startTime = performance.now();
  
  return (statusCode: number) => {
    const durationMs = performance.now() - startTime;
    telemetry.recordHttpRequest(
      request.method,
      url.pathname,
      statusCode,
      durationMs
    );
  };
}
