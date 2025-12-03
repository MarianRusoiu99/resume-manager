/**
 * GET /api/template/[id] - Get a specific resume template by ID
 * PATCH /api/template/[id] - Update a template
 * DELETE /api/template/[id] - Delete a template
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { templateRepository } from '@/lib/repositories/template.repository';
import { templateService } from '@/lib/services/template.service';
import { createApiHandler } from '@/lib/api-handler';

export const GET = createApiHandler(
  async (request, { params }) => {
    const { id } = await params;
    const template = await templateRepository.findById(id);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  },
  { isPublic: true }
);

export const PATCH = createApiHandler(async (request, { params }) => {
  const { id } = await params;
  const body = await request.json();

  const result = await templateService.updateTemplate(id, body);

  if (!result.success) {
    const statusCode = result.error === 'Template not found' ? 404 : 400;
    return NextResponse.json(
      { error: result.error },
      { status: statusCode }
    );
  }

  // Revalidate the templates page to show the updated template
  revalidatePath('/templates');
  revalidatePath(`/templates/${id}`);

  return NextResponse.json(result.data);
});

export const DELETE = createApiHandler(async (request, { params }) => {
  const { id } = await params;

  const result = await templateService.deleteTemplate(id);

  if (!result.success) {
    const statusCode = result.error === 'Template not found' ? 404 : 400;
    return NextResponse.json(
      { error: result.error },
      { status: statusCode }
    );
  }

  // Revalidate the templates page after deletion
  revalidatePath('/templates');

  return NextResponse.json({ success: true });
});
