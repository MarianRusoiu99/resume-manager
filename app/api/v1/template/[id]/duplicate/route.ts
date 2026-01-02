/**
 * POST /api/template/[id]/duplicate
 * Duplicate an existing template
 */

import { createApiHandler } from '@/lib/api/handler';
import { templateService } from '@/lib/services';
import { templateRepository } from '@/lib/repositories/templates.repository';
import { failure } from '@/lib/types/service-result';

export const POST = createApiHandler(async (_request, { params }) => {
  const { id } = await params;

  // Get original template
  const original = await templateRepository.findById(id);
  if (!original) {
    return failure('Template not found', 'NOT_FOUND');
  }

  // Create duplicate with modified name
  return templateService.createTemplate({
    name: `${original.name} (Copy)`,
    description: original.description ?? undefined,
    htmlTemplate: original.htmlTemplate,
    isPublic: false, // Duplicates are private by default
  });
});
