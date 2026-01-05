/**
 * Metrics Module
 * 
 * Provides metrics collection for monitoring and alerting.
 * 
 * Current implementation: In-memory stub (logs metrics)
 * Production: Connect to Prometheus, Datadog, or CloudWatch
 */

export type { MetricLabels, Counter, Gauge, Histogram, HistogramStats } from './types';
export { MetricsClient } from './client';
export { metrics, AppMetrics } from './app-metrics';
