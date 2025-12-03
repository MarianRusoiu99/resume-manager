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
import { logger } from '@/lib/utils';

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
  checks: {
    database: ComponentHealth;
    memory: ComponentHealth;
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
  return process.env.npm_package_version || process.env.APP_VERSION || '1.0.0';
}

/**
 * Calculate overall health status
 */
function calculateOverallStatus(checks: HealthCheckResponse['checks']): HealthCheckResponse['status'] {
  const allHealthy = Object.values(checks).every(check => check.healthy);
  const anyHealthy = Object.values(checks).some(check => check.healthy);
  
  if (allHealthy) return 'healthy';
  if (anyHealthy) return 'degraded';
  return 'unhealthy';
}

/**
 * GET /api/health
 * 
 * Returns comprehensive health status of the application.
 * 
 * @returns Health check response with status and component details
 */
export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const requestStart = Date.now();
  
  try {
    // Run health checks in parallel
    const [database, memory] = await Promise.all([
      checkDatabase(),
      Promise.resolve(checkMemory()),
    ]);
    
    const checks = { database, memory };
    const status = calculateOverallStatus(checks);
    
    const response: HealthCheckResponse = {
      status,
      timestamp: new Date().toISOString(),
      version: getVersion(),
      uptime: Math.round((Date.now() - startTime) / 1000), // seconds
      checks,
    };
    
    // Log health check for monitoring
    if (status !== 'healthy') {
      logger.warn('Health check degraded or unhealthy', {
        status,
        checks,
        duration: Date.now() - requestStart,
      });
    }
    
    // Return appropriate status code based on health
    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(response, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // Return unhealthy status on unexpected errors
    const response: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: getVersion(),
      uptime: Math.round((Date.now() - startTime) / 1000),
      checks: {
        database: { healthy: false, error: 'Health check failed' },
        memory: { healthy: false, error: 'Health check failed' },
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
