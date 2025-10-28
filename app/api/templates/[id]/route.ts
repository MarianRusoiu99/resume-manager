/**
 * GET /api/templates/[id]
 * Get a specific resume template by ID
 */

import { NextResponse } from 'next/server';
import { templateRepository } from '@/lib/repositories/template.repository';
import { logger } from '@/lib/utils/logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await templateRepository.findById(id);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    const { id } = await params;
    logger.error(`Failed to fetch template ${id}`, error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}
