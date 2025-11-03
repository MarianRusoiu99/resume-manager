/**
 * GET /api/templates - List all public resume templates
 * POST /api/templates - Create a new template
 */

import { NextResponse } from 'next/server';
import { templateRepository } from '@/lib/repositories/template.repository';
import { templateService } from '@/lib/services/template.service';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/lib/auth/config';

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

export async function POST(request: Request) {
  try {
    // Check authentication (templates are admin-only for now)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const result = await templateService.createTemplate(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    logger.error('Failed to create template', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
