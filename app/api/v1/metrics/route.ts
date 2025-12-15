/**
 * Metrics API Endpoint
 * 
 * Exposes application metrics for monitoring systems.
 * 
 * @route GET /api/metrics
 */

import { NextResponse } from 'next/server';
import { metrics } from '@/lib/telemetry';
import { circuitBreakerRegistry } from '@/lib/resilience';

/**
 * GET /api/v1/metrics
 * 
 * Returns application metrics in JSON format.
 * 
 * For Prometheus integration, you would format this as:
 * ```
 * # HELP http_requests_total Total HTTP requests
 * # TYPE http_requests_total counter
 * http_requests_total{method="GET",path="/api/v1/health"} 42
 * ```
 * 
 * @returns Metrics data
 */
export async function GET(): Promise<NextResponse> {
  const metricsData = metrics.getMetrics();
  const circuitBreakerStats = circuitBreakerRegistry.getAllStats();
  
  const response = {
    timestamp: new Date().toISOString(),
    metrics: metricsData,
    circuitBreakers: circuitBreakerStats,
  };
  
  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json',
    },
  });
}
