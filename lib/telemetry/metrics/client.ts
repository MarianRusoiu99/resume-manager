/**
 * Metrics Module - Client
 * 
 * In-memory metrics client implementation.
 */

import { logger } from '@/lib/utils/logger';
import type { MetricLabels, Counter, Gauge, Histogram, HistogramStats } from './types';

export class MetricsClient {
  private readonly counters: Map<string, number> = new Map();
  private readonly gauges: Map<string, number> = new Map();
  private readonly histograms: Map<string, number[]> = new Map();
  private readonly enabled: boolean;

  constructor(enabled = true) {
    this.enabled = enabled;
  }

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

  increment(name: string, labels?: MetricLabels, value = 1): void {
    if (!this.enabled) return;

    const key = this.createKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    logger.debug(`[Metric] ${key} += ${value} (total: ${current + value})`);
  }

  gauge(name: string, value: number, labels?: MetricLabels): void {
    if (!this.enabled) return;

    const key = this.createKey(name, labels);
    this.gauges.set(key, value);

    logger.debug(`[Metric] ${key} = ${value}`);
  }

  histogram(name: string, value: number, labels?: MetricLabels): void {
    if (!this.enabled) return;

    const key = this.createKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);

    logger.debug(`[Metric] ${key} observed ${value}`);
  }

  startTimer(name: string, labels?: MetricLabels): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.histogram(name, duration, labels);
      return duration;
    };
  }

  createCounter(name: string): Counter {
    return {
      inc: (labels?: MetricLabels) => this.increment(name, labels),
      add: (value: number, labels?: MetricLabels) => this.increment(name, labels, value),
    };
  }

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

  createHistogram(name: string): Histogram {
    return {
      observe: (value: number, labels?: MetricLabels) => this.histogram(name, value, labels),
      startTimer: (labels?: MetricLabels) => this.startTimer(name, labels),
    };
  }

  getMetrics(): {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    histograms: Record<string, HistogramStats>;
  } {
    const histogramStats: Record<string, HistogramStats> = {};
    
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

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}
