/**
 * Resume HTML Preview API
 * GET /api/resume/[id]/preview
 * Returns rendered HTML for iframe preview
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { renderCompleteDocument } from '@/lib/templates/renderer';
import type { Resume } from '@/lib/validations/jsonresume';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await context.params;

    // Fetch resume with template
    const resume = await prisma.generatedResume.findUnique({
      where: { id },
      include: { template: true },
    });

    if (!resume) {
      return new NextResponse('Resume not found', { status: 404 });
    }

    if (resume.userId !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Get template (use default if none selected)
    let template = resume.template;
    
    if (!template) {
      // Get first available template as fallback
      template = await prisma.resumeTemplate.findFirst({
        where: { isPublic: true },
      });
      
      if (!template) {
        return new NextResponse('No template available', { status: 500 });
      }
    }

    // Render HTML
    const html = renderCompleteDocument(
      template.htmlTemplate,
      template.cssStyles,
      resume.resume as Resume
    );

    // Return HTML for iframe
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Resume preview error:', error);
    return new NextResponse(
      `<html><body style="font-family: sans-serif; padding: 40px;"><h1>Error loading preview</h1><p>${error instanceof Error ? error.message : 'Unknown error'}</p></body></html>`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}
