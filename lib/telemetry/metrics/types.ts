/**
 * Metrics Module - Types
 * 
 * Type definitions for metrics collection.
 */

export type MetricLabels = Record<string, string | number | boolean>;

export interface Counter {
  inc(labels?: MetricLabels): void;
  add(value: number, labels?: MetricLabels): void;
}

export interface Gauge {
  set(value: number, labels?: MetricLabels): void;
  inc(labels?: MetricLabels): void;
  dec(labels?: MetricLabels): void;
  add(value: number, labels?: MetricLabels): void;
}

export interface Histogram {
  observe(value: number, labels?: MetricLabels): void;
  startTimer(labels?: MetricLabels): () => number;
}

export interface HistogramStats {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
}
