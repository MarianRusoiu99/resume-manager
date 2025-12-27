/**
 * GET /api/template/[id] - Get a specific resume template by ID
 * PATCH /api/template/[id] - Update a template
 * DELETE /api/template/[id] - Delete a template
 */

import { revalidatePath } from 'next/cache';
import { templateService } from '@/lib/services/template.service';
import { createApiHandler } from '@/lib/api-handler';
import { updateTemplateSchema } from '@/lib/validations/api-schemas';
import { success } from '@/lib/types/service-result';

export const GET = createApiHandler(
  async (_request, { params }) => {
    const { id } = await params;
    return templateService.getTemplateById(id);
  },
  { isPublic: true }
);

export const PATCH = createApiHandler(
  async (_request, { params }, _session, body) => {
    const { id } = await params;

    const result = await templateService.updateTemplate(id, body ?? {});

    if (!result.success) {
      return result;
    }

    // Revalidate the templates page to show the updated template
    revalidatePath('/templates');
    revalidatePath(`/templates/${id}`);

    return result;
  },
  { bodySchema: updateTemplateSchema, verifyUser: true }
);

export const DELETE = createApiHandler(
  async (_request, { params }) => {
    const { id } = await params;

    const result = await templateService.deleteTemplate(id);

    if (!result.success) {
      return result;
    }

    // Revalidate the templates page after deletion
    revalidatePath('/templates');

    return success({ success: true });
  },
  { verifyUser: true }
);

