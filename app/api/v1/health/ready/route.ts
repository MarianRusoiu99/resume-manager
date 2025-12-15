/**
 * Readiness Probe Endpoint
 * 
 * Endpoint for Kubernetes readiness probes.
 * Returns 200 only if the application is ready to receive traffic.
 * Checks critical dependencies like database connectivity.
 * 
 * @route GET /api/health/ready
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/utils';

/**
 * GET /api/health/ready
 * 
 * Readiness check - verifies the app can handle requests.
 * Checks database connectivity.
 * 
 * Use for Kubernetes readiness probes.
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Check database connectivity
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - start;
    
    // If database latency is too high, consider not ready
    if (dbLatency > 5000) {
      logger.warn('Readiness check: high database latency', { dbLatency });
      return NextResponse.json(
        { 
          status: 'not_ready',
          reason: 'High database latency',
          dbLatency,
          timestamp: new Date().toISOString(),
        },
        { 
          status: 503,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }
    
    return NextResponse.json(
      { 
        status: 'ready',
        dbLatency,
        timestamp: new Date().toISOString(),
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    logger.error('Readiness check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return NextResponse.json(
      { 
        status: 'not_ready',
        reason: 'Database connection failed',
        timestamp: new Date().toISOString(),
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}

/**
 * HEAD /api/health/ready
 * 
 * Quick readiness check for minimal overhead.
 */
export async function HEAD(): Promise<NextResponse> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
