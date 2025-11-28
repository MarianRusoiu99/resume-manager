import { NextResponse } from 'next/server';
import { getSwaggerSpec } from '@/lib/swagger';

export async function GET() {
  // Generate spec at runtime because generating the Swagger spec at build time caused issues with dynamic imports and environment variables
  // Specifically, some API route definitions and environment-dependent values are only available at runtime, leading to incomplete or incorrect specs when generated at build time.
  // By generating the spec at runtime, we ensure all routes and environment variables are correctly included in the documentation.
  const swaggerSpec = getSwaggerSpec();
  return NextResponse.json(swaggerSpec);
}
