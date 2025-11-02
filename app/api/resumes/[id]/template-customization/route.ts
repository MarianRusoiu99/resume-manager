/**
 * API Route: PATCH /api/resumes/:id/template-customization
 * Updates template customization for a specific resume
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { generatedResumeRepository } from '@/lib/repositories/generated-resume.repository';
import { z } from 'zod';

// Validation schema for template customization
const customizationSchema = z.object({
  customization: z.object({
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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get resume ID from params
    const { id: resumeId } = await context.params;

    // Parse and validate request body
    const body = await request.json();
    const validation = customizationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid customization data',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { customization } = validation.data;

    // Verify resume exists and belongs to user
    const resume = await generatedResumeRepository.findById(resumeId);

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    if (resume.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update customization using updateTemplate (this will clear PDF URL to force regeneration)
    const updatedResume = await generatedResumeRepository.updateTemplate(
      resumeId,
      resume.templateId || undefined,
      customization
    );

    return NextResponse.json({
      success: true,
      resume: updatedResume,
    });
  } catch (error) {
    console.error('Error updating template customization:', error);
    return NextResponse.json(
      { error: 'Failed to update customization' },
      { status: 500 }
    );
  }
}
