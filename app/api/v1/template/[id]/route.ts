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
import { updateTemplateSchema } from '@/lib/validations/api-schemas';
import { success } from '@/lib/types/service-result';

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

export const PATCH = createApiHandler(
  async (request, { params }, session, body) => {
    const { id } = await params;

    const input = body ?? {};

    const result = await templateService.updateTemplate(id, input);

    if (!result.success) {
      return result;
    }

    // Revalidate the templates page to show the updated template
    revalidatePath('/templates');
    revalidatePath(`/templates/${id}`);

    return NextResponse.json(result.data);
  },
  { bodySchema: updateTemplateSchema, verifyUser: true }
);

export const DELETE = createApiHandler(async (request, { params }) => {
  const { id } = await params;

  const result = await templateService.deleteTemplate(id);

  if (!result.success) return result;

  // Revalidate the templates page after deletion
  revalidatePath('/templates');

  return success({ success: true });
}, { verifyUser: true });
