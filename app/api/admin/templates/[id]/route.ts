import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { templateRepository } from '@/lib/repositories/template.repository';
import type { TemplateDefinition } from '@/types/template';

// Zod schema for template definition validation
const templateDefinitionSchema = z.object({
  layout: z.object({
    paperSize: z.enum(['letter', 'a4']),
    margins: z.object({
      top: z.number().min(0).max(100),
      right: z.number().min(0).max(100),
      bottom: z.number().min(0).max(100),
      left: z.number().min(0).max(100),
    }),
    columns: z.union([z.literal(1), z.literal(2)]),
    columnGap: z.number().min(0).max(50).optional(),
  }),
  typography: z.object({
    bodyFont: z.string(),
    headingFont: z.string(),
    fontSize: z.object({
      name: z.number().min(14).max(32),
      heading: z.number().min(10).max(20),
      subheading: z.number().min(8).max(16),
      body: z.number().min(8).max(14),
      small: z.number().min(6).max(10),
    }),
    lineHeight: z.number().min(1).max(2),
  }),
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    background: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    border: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }),
  sections: z.object({
    showDividers: z.boolean(),
    dividerThickness: z.number().min(0).max(5),
    spacing: z.number().min(0).max(50),
    order: z.array(z.string()),
  }),
  contact: z.object({
    layout: z.enum(['horizontal', 'vertical', 'grid']),
    showIcons: z.boolean(),
    iconSize: z.number().min(8).max(20).optional(),
  }),
  experience: z.object({
    dateFormat: z.enum(['month-year', 'year', 'full']),
    showCompanyLogo: z.boolean(),
    bulletStyle: z.enum(['disc', 'square', 'dash', 'arrow']),
  }),
  skills: z.object({
    format: z.enum(['list', 'grid', 'bars', 'tags']),
    groupByCategory: z.boolean(),
  }),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  definition: templateDefinitionSchema.optional(),
});

/**
 * GET /api/admin/templates/:id
 * Fetch a specific template by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const template = await templateRepository.findById(id);

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/templates/:id
 * Update an existing template
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = updateTemplateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if template exists
    const existingTemplate = await templateRepository.findById(id);
    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Update template
    const updatedTemplate = await templateRepository.update(id, {
      ...(data.name && { name: data.name }),
      ...(data.category && { category: data.category }),
      ...(data.description && { description: data.description }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      ...(data.definition && { definition: data.definition as TemplateDefinition }),
    });

    return NextResponse.json({
      message: 'Template updated successfully',
      template: updatedTemplate,
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/templates/:id
 * Delete a template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if template exists
    const existingTemplate = await templateRepository.findById(id);
    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Delete template
    await templateRepository.delete(id);

    return NextResponse.json({
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
