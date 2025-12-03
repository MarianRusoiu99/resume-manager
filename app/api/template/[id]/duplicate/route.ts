/**
 * POST /api/template/[id]/duplicate
 * Duplicate an existing template
 */

import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api-handler';
import { templateService } from '@/lib/services/template.service';
import { templateRepository } from '@/lib/repositories/template.repository';

export const POST = createApiHandler(async (request, { params }) => {
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
    category: original.category.toUpperCase() as 'PROFESSIONAL' | 'MODERN' | 'CREATIVE' | 'ATS_OPTIMIZED' | 'MINIMAL',
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
});
