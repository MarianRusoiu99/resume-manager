/**
 * GET /api/template - List all public resume templates
 * POST /api/template - Create a new template
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { templateRepository } from '@/lib/repositories/template.repository';
import { templateService } from '@/lib/services/template.service';
import { createApiHandler } from '@/lib/api-handler';
import { createTemplateSchema } from '@/lib/validations/api-schemas';

export const GET = createApiHandler(
  async (request) => {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const templates = category
      ? await templateRepository.findByCategory(category)
      : await templateRepository.findAllPublic();

    return NextResponse.json({
      templates,
      count: templates.length,
    });
  },
  { isPublic: true }
);

export const POST = createApiHandler(
  async (request, context, session, body) => {
    if (!body) {
      return NextResponse.json({ error: 'Missing request body' }, { status: 400 });
    }

    const result = await templateService.createTemplate(body);

    if (!result.success) {
      return result;
    }

    // Revalidate the templates page to show the new template
    revalidatePath('/templates');

    return NextResponse.json(result.data, { status: 201 });
  },
  { bodySchema: createTemplateSchema, verifyUser: true }
);
