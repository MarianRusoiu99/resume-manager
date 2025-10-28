/**
 * GET /api/templates
 * List all public resume templates
 */

import { NextResponse } from 'next/server';
import { templateRepository } from '@/lib/repositories/template.repository';
import { logger } from '@/lib/utils/logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const templates = category
      ? await templateRepository.findByCategory(category)
      : await templateRepository.findAllPublic();

    return NextResponse.json({
      templates,
      count: templates.length,
    });
  } catch (error) {
    logger.error('Failed to fetch templates', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
