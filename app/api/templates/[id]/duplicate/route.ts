/**
 * POST /api/templates/[id]/duplicate
 * Duplicate an existing template
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { templateService } from '@/lib/services/template.service';
import { templateRepository } from '@/lib/repositories/template.repository';
import { logger } from '@/lib/utils/logger';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get original template
    const original = await templateRepository.findById(id);
    if (!original) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Create duplicate with modified name
    const result = await templateService.createTemplate({
      name: `${original.name} (Copy)`,
      category: original.category,
      description: original.description,
      htmlTemplate: original.htmlTemplate,
      cssStyles: original.cssStyles,
      isPublic: false, // Duplicates are private by default
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    const { id } = await params;
    logger.error(`Failed to duplicate template ${id}`, error);
    return NextResponse.json(
      { error: 'Failed to duplicate template' },
      { status: 500 }
    );
  }
}
