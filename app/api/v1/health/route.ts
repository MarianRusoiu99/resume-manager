/**
 * Health Check API Endpoint
 * 
 * Provides comprehensive health status for the application.
 * Used for:
 * - Container orchestration (K8s liveness/readiness probes)
 * - Load balancer health checks
 * - Monitoring and alerting systems
 * - Service discovery
 * 
 * @route GET /api/health
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { env } from '@/lib/config';
import { logger } from '@/lib/utils';
import { checkRedisHealth } from '@/lib/redis';
import { circuitBreakerRegistry } from '@/lib/resilience';
import { metrics } from '@/lib/telemetry';

/**
 * Health check status for a single component
 */
interface ComponentHealth {
  healthy: boolean;
  latency?: number;
  error?: string;
  details?: Record<string, unknown>;
}

/**
 * Overall health check response
 */
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  checks: {
    database: ComponentHealth;
    redis: ComponentHealth;
    memory: ComponentHealth;
    circuitBreakers: ComponentHealth;
  };
  metrics?: {
    counters: Record<string, number>;
    gauges: Record<string, number>;
  };
}

// Track application start time
const startTime = Date.now();

/**
 * Check database connectivity and latency
 */
async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();
  
  try {
    // Simple query to test database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    const latency = Date.now() - start;
    
    return {
      healthy: true,
      latency,
      details: {
        provider: 'postgresql',
      },
    };
  } catch (error) {
    const latency = Date.now() - start;
    
    return {
      healthy: false,
      latency,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): ComponentHealth {
  try {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const heapUsedPercent = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);
    
    // Consider unhealthy if heap usage is above 90%
    const healthy = heapUsedPercent < 90;
    
    return {
      healthy,
      details: {
        heapUsedMB,
        heapTotalMB,
        heapUsedPercent,
        rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
        externalMB: Math.round(memoryUsage.external / 1024 / 1024),
      },
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown memory check error',
    };
  }
}

/**
 * Get application version from package.json
 */
function getVersion(): string {
  return env.APP_VERSION;
}

/**
 * Check Redis connectivity and latency
 */
async function checkRedis(): Promise<ComponentHealth> {
  try {
    const health = await checkRedisHealth();
    
    return {
      healthy: health.connected,
      latency: health.latencyMs,
      error: health.error,
      details: {
        provider: health.provider,
      },
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown Redis error',
    };
  }
}

/**
 * Check circuit breakers status
 */
function checkCircuitBreakers(): ComponentHealth {
  try {
    const stats = circuitBreakerRegistry.getAllStats();
    const breakerCount = Object.keys(stats).length;
    
    // Check if any circuit breaker is open
    const openBreakers = Object.entries(stats)
      .filter(([, s]) => (s as { state: string }).state === 'OPEN')
      .map(([name]) => name);
    
    const halfOpenBreakers = Object.entries(stats)
      .filter(([, s]) => (s as { state: string }).state === 'HALF_OPEN')
      .map(([name]) => name);
    
    const healthy = openBreakers.length === 0;
    
    return {
      healthy,
      details: {
        total: breakerCount,
        open: openBreakers,
        halfOpen: halfOpenBreakers,
        stats: breakerCount > 0 ? stats : undefined,
      },
    };
  } catch (error) {
    return {
      healthy: true, // Don't fail health check if circuit breaker check fails
      error: error instanceof Error ? error.message : 'Unknown circuit breaker error',
    };
  }
}

/**
 * Calculate overall health status
 * Database is critical, others are optional
 */
function calculateOverallStatus(checks: HealthCheckResponse['checks']): HealthCheckResponse['status'] {
  // Database is critical
  if (!checks.database.healthy) return 'unhealthy';
  
  // Memory critical issue
  if (!checks.memory.healthy) return 'unhealthy';
  
  // Redis and circuit breakers are non-critical
  const nonCriticalHealthy = checks.redis.healthy && checks.circuitBreakers.healthy;
  
  if (nonCriticalHealthy) return 'healthy';
  return 'degraded';
}

/**
 * Get status code for health status
 */
function getStatusCode(status: HealthCheckResponse['status']): number {
  switch (status) {
    case 'healthy':
      return 200;
    case 'degraded':
      return 200; // Still return 200 for degraded (service is functional)
    case 'unhealthy':
      return 503;
    default:
      return 503;
  }
}

/**
 * GET /api/health
 * 
 * Returns comprehensive health status of the application.
 * 
 * Query parameters:
 * - verbose: Include metrics data in response
 * 
 * @returns Health check response with status and component details
 */
export async function GET(request: Request): Promise<NextResponse<HealthCheckResponse>> {
  const requestStart = Date.now();
  const url = new URL(request.url);
  const verbose = url.searchParams.get('verbose') === 'true';
  
  try {
    // Run health checks in parallel
    const [database, redis, memory, circuitBreakers] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      Promise.resolve(checkMemory()),
      Promise.resolve(checkCircuitBreakers()),
    ]);
    
    const checks = { database, redis, memory, circuitBreakers };
    const status = calculateOverallStatus(checks);
    
    const response: HealthCheckResponse = {
      status,
      timestamp: new Date().toISOString(),
      version: getVersion(),
      uptime: Math.round((Date.now() - startTime) / 1000), // seconds
      environment: process.env.NODE_ENV || 'development',
      checks,
    };

    // Include metrics if verbose mode
    if (verbose) {
      const metricsData = metrics.getMetrics();
      response.metrics = {
        counters: metricsData.counters,
        gauges: metricsData.gauges,
      };
    }
    
    // Log health check for monitoring
    if (status !== 'healthy') {
      logger.warn('Health check degraded or unhealthy', {
        status,
        checks,
        duration: Date.now() - requestStart,
      });
    }
    
    const statusCode = getStatusCode(status);
    
    return NextResponse.json(response, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    logger.error('Health check failed', error);
    
    // Return unhealthy status on unexpected errors
    const response: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: getVersion(),
      uptime: Math.round((Date.now() - startTime) / 1000),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: { healthy: false, error: 'Health check failed' },
        redis: { healthy: false, error: 'Health check failed' },
        memory: { healthy: false, error: 'Health check failed' },
        circuitBreakers: { healthy: false, error: 'Health check failed' },
      },
    };
    
    return NextResponse.json(response, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}

/**
 * HEAD /api/health
 * 
 * Simple health check for load balancers that only need status code.
 * Returns 200 if healthy, 503 if unhealthy.
 */
export async function HEAD(): Promise<NextResponse> {
  try {
    // Quick database check
    await prisma.$queryRaw`SELECT 1`;
    
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
