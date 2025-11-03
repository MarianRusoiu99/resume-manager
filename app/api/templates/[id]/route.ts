/**
 * GET /api/templates/[id] - Get a specific resume template by ID
 * PATCH /api/templates/[id] - Update a template
 * DELETE /api/templates/[id] - Delete a template
 */

import { NextResponse } from 'next/server';
import { templateRepository } from '@/lib/repositories/template.repository';
import { templateService } from '@/lib/services/template.service';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/lib/auth/config';

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

export async function PATCH(
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
    const body = await request.json();

    const result = await templateService.updateTemplate(id, body);

    if (!result.success) {
      const statusCode = result.error === 'Template not found' ? 404 : 400;
      return NextResponse.json(
        { error: result.error },
        { status: statusCode }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    const { id } = await params;
    logger.error(`Failed to update template ${id}`, error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const result = await templateService.deleteTemplate(id);

    if (!result.success) {
      const statusCode = result.error === 'Template not found' ? 404 : 400;
      return NextResponse.json(
        { error: result.error },
        { status: statusCode }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const { id } = await params;
    logger.error(`Failed to delete template ${id}`, error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
