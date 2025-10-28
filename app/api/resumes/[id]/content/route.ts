/**
 * API Route: PATCH /api/resumes/:id/content
 * Updates resume content for a specific resume
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { generatedResumeRepository } from '@/lib/repositories/generated-resume.repository';
import { z } from 'zod';

// Validation schema for resume content
const contentSchema = z.object({
  content: z.object({
    personalInfo: z.object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      location: z.string().optional(),
      links: z.array(z.string()).optional(),
    }),
    summary: z.string(),
    experience: z.array(
      z.object({
        company: z.string(),
        position: z.string(),
        startDate: z.string(),
        endDate: z.string().nullable(),
        description: z.string(),
        bulletPoints: z.array(z.string()),
      })
    ),
    education: z.array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        field: z.string(),
        startDate: z.string(),
        endDate: z.string().nullable(),
        gpa: z.string().optional(),
      })
    ),
    skills: z.object({
      technical: z.array(z.string()),
      soft: z.array(z.string()),
    }),
    certifications: z
      .array(
        z.object({
          name: z.string(),
          issuer: z.string(),
          date: z.string(),
          credentialUrl: z.string().optional(),
        })
      )
      .optional(),
    languages: z
      .array(
        z.object({
          language: z.string(),
          proficiency: z.string(),
        })
      )
      .optional(),
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
    const validation = contentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid content data',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { content } = validation.data;

    // Verify resume exists and belongs to user
    const resume = await generatedResumeRepository.findById(resumeId);

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    if (resume.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update content (this will mark resume as edited and clear PDF URL)
    const updatedResume = await generatedResumeRepository.updateContent(
      resumeId,
      content as Record<string, unknown>
    );

    return NextResponse.json({
      success: true,
      resume: updatedResume,
    });
  } catch (error) {
    console.error('Error updating resume content:', error);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}
