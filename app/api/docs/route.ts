import { NextResponse } from 'next/server';
import { getSwaggerSpec } from '@/lib/swagger';

export async function GET() {
  // Generate spec at runtime to avoid build-time issues
  const swaggerSpec = getSwaggerSpec();
  return NextResponse.json(swaggerSpec);
}
