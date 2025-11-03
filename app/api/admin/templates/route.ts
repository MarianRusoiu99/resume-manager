/**
 * API Route: POST /api/admin/templates
 * Create a new resume template (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { templateRepository } from '@/lib/repositories/template.repository';
import { z } from 'zod';

// Validation schema for template creation
const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  category: z.enum(['professional', 'modern', 'creative', 'ats-optimized', 'minimal']),
  description: z.string().min(1, 'Description is required'),
  version: z.string().default('1.0.0'),
  isPublic: z.boolean().default(true),
  definition: z.object({
    layout: z.object({
      paperSize: z.enum(['letter', 'a4']),
      margins: z.object({
        top: z.number(),
        right: z.number(),
        bottom: z.number(),
        left: z.number(),
      }),
      columns: z.union([z.literal(1), z.literal(2)]),
      columnGap: z.number().optional(),
    }),
    typography: z.object({
      bodyFont: z.string(),
      headingFont: z.string(),
      fontSize: z.object({
        name: z.number(),
        heading: z.number(),
        subheading: z.number(),
        body: z.number(),
        small: z.number(),
      }),
      lineHeight: z.number(),
    }),
    colors: z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
      background: z.string(),
      border: z.string(),
    }),
    sections: z.object({
      showDividers: z.boolean(),
      dividerThickness: z.number(),
      spacing: z.number(),
      order: z.array(z.string()),
    }),
    contact: z.object({
      layout: z.enum(['horizontal', 'vertical', 'grid']),
      showIcons: z.boolean(),
      iconSize: z.number().optional(),
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
  }),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check when user roles are implemented
    // For now, any authenticated user can create templates
    // if (session.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    // }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = templateSchema.parse(body);

    // Create template
    const template = await templateRepository.create({
      name: validatedData.name,
      category: validatedData.category,
      description: validatedData.description,
      isPublic: validatedData.isPublic,
      definition: validatedData.definition,
    });

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        category: template.category,
      },
    });
  } catch (error) {
    console.error('Error creating template:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
