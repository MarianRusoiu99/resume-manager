/**
 * Liveness Probe Endpoint
 * 
 * Simple endpoint for Kubernetes liveness probes.
 * Returns 200 if the application is running.
 * 
 * Unlike /api/health, this doesn't check dependencies.
 * It only verifies the process is alive and responding.
 * 
 * @route GET /api/health/live
 */

import { NextResponse } from 'next/server';

/**
 * GET /api/health/live
 * 
 * Simple liveness check - returns 200 if process is running.
 * Use for Kubernetes liveness probes.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { 
      status: 'alive',
      timestamp: new Date().toISOString(),
    },
    { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}

/**
 * HEAD /api/health/live
 * 
 * Even simpler liveness check for minimal overhead.
 */
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 });
}
