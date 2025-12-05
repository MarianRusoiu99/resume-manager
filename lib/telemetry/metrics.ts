/**
 * Metrics Module
 * 
 * Provides metrics collection for monitoring and alerting.
 * 
 * Current implementation: In-memory stub (logs metrics)
 * Production: Connect to Prometheus, Datadog, or CloudWatch
 */

import { logger } from '@/lib/utils/logger';

/**
 * Labels for metric dimensions
 */
export type MetricLabels = Record<string, string | number | boolean>;

/**
 * Counter metric - monotonically increasing value
 */
export interface Counter {
  /** Increment counter by 1 */
  inc(labels?: MetricLabels): void;
  /** Add value to counter */
  add(value: number, labels?: MetricLabels): void;
}

/**
 * Gauge metric - value that can go up and down
 */
export interface Gauge {
  /** Set gauge value */
  set(value: number, labels?: MetricLabels): void;
  /** Increment gauge by 1 */
  inc(labels?: MetricLabels): void;
  /** Decrement gauge by 1 */
  dec(labels?: MetricLabels): void;
  /** Add value to gauge */
  add(value: number, labels?: MetricLabels): void;
}

/**
 * Histogram metric - distribution of values
 */
export interface Histogram {
  /** Observe a value */
  observe(value: number, labels?: MetricLabels): void;
  /** Start a timer, returns function to stop and record */
  startTimer(labels?: MetricLabels): () => number;
}

/**
 * Metrics storage for the stub implementation
 */
interface MetricValue {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  labels: MetricLabels;
  timestamp: number;
}

/**
 * In-memory metrics client
 * 
 * This is a stub implementation that:
 * 1. Stores metrics in memory for debugging
 * 2. Logs metrics at debug level
 * 3. Exposes metrics for the /api/metrics endpoint
 * 
 * To integrate with a real metrics system:
 * 1. Implement the same interface
 * 2. Replace this with prom-client, datadog-metrics, etc.
 */
export class MetricsClient {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private enabled: boolean;

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  /**
   * Create a key from name and labels
   */
  private createKey(name: string, labels?: MetricLabels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  /**
   * Increment a counter
   */
  increment(name: string, labels?: MetricLabels, value = 1): void {
    if (!this.enabled) return;

    const key = this.createKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    logger.debug(`[Metric] ${key} += ${value} (total: ${current + value})`);
  }

  /**
   * Set a gauge value
   */
  gauge(name: string, value: number, labels?: MetricLabels): void {
    if (!this.enabled) return;

    const key = this.createKey(name, labels);
    this.gauges.set(key, value);

    logger.debug(`[Metric] ${key} = ${value}`);
  }

  /**
   * Record a histogram observation
   */
  histogram(name: string, value: number, labels?: MetricLabels): void {
    if (!this.enabled) return;

    const key = this.createKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);

    logger.debug(`[Metric] ${key} observed ${value}`);
  }

  /**
   * Create a timer for measuring duration
   */
  startTimer(name: string, labels?: MetricLabels): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.histogram(name, duration, labels);
      return duration;
    };
  }

  /**
   * Create a counter instance
   */
  createCounter(name: string): Counter {
    return {
      inc: (labels?: MetricLabels) => this.increment(name, labels),
      add: (value: number, labels?: MetricLabels) => this.increment(name, labels, value),
    };
  }

  /**
   * Create a gauge instance
   */
  createGauge(name: string): Gauge {
    return {
      set: (value: number, labels?: MetricLabels) => this.gauge(name, value, labels),
      inc: (labels?: MetricLabels) => {
        const key = this.createKey(name, labels);
        const current = this.gauges.get(key) || 0;
        this.gauge(name, current + 1, labels);
      },
      dec: (labels?: MetricLabels) => {
        const key = this.createKey(name, labels);
        const current = this.gauges.get(key) || 0;
        this.gauge(name, current - 1, labels);
      },
      add: (value: number, labels?: MetricLabels) => {
        const key = this.createKey(name, labels);
        const current = this.gauges.get(key) || 0;
        this.gauge(name, current + value, labels);
      },
    };
  }

  /**
   * Create a histogram instance
   */
  createHistogram(name: string): Histogram {
    return {
      observe: (value: number, labels?: MetricLabels) => this.histogram(name, value, labels),
      startTimer: (labels?: MetricLabels) => this.startTimer(name, labels),
    };
  }

  /**
   * Get all metrics (for debugging/export)
   */
  getMetrics(): {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    histograms: Record<string, { count: number; sum: number; avg: number; min: number; max: number }>;
  } {
    const histogramStats: Record<string, { count: number; sum: number; avg: number; min: number; max: number }> = {};
    
    for (const [key, values] of this.histograms) {
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        histogramStats[key] = {
          count: values.length,
          sum,
          avg: sum / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
        };
      }
    }

    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: histogramStats,
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

/**
 * Global metrics instance
 */
export const metrics = new MetricsClient(process.env.NODE_ENV !== 'test');

/**
 * Predefined metrics for the application
 */
export const AppMetrics = {
  // Request metrics
  httpRequestsTotal: metrics.createCounter('http_requests_total'),
  httpRequestDuration: metrics.createHistogram('http_request_duration_ms'),
  httpRequestErrors: metrics.createCounter('http_request_errors_total'),

  // AI metrics
  aiGenerationsTotal: metrics.createCounter('ai_generations_total'),
  aiGenerationDuration: metrics.createHistogram('ai_generation_duration_ms'),
  aiTokensUsed: metrics.createCounter('ai_tokens_used_total'),
  aiErrors: metrics.createCounter('ai_errors_total'),

  // Resume metrics
  resumesGenerated: metrics.createCounter('resumes_generated_total'),
  coverLettersGenerated: metrics.createCounter('cover_letters_generated_total'),
  pdfExports: metrics.createCounter('pdf_exports_total'),

  // User metrics
  activeUsers: metrics.createGauge('active_users'),
  profilesCreated: metrics.createCounter('profiles_created_total'),

  // Cache metrics
  cacheHits: metrics.createCounter('cache_hits_total'),
  cacheMisses: metrics.createCounter('cache_misses_total'),

  // Circuit breaker metrics
  circuitBreakerState: metrics.createGauge('circuit_breaker_state'),
  circuitBreakerTrips: metrics.createCounter('circuit_breaker_trips_total'),
};
