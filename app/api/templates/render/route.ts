/**
 * Template Rendering API
 * POST /api/templates/render
 * Renders HTML template with resume data
 */

import { NextResponse } from 'next/server';
import { renderCompleteDocument } from '@/lib/templates/renderer';
import { resumeSchema } from '@/lib/validations/jsonresume';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { templateHtml, templateCss, resumeData } = body;

    // Validate inputs
    if (!templateHtml || !templateCss || !resumeData) {
      return NextResponse.json(
        { error: 'Missing required fields: templateHtml, templateCss, resumeData' },
        { status: 400 }
      );
    }

    // Validate resume data against JSON Resume schema
    const validatedResume = resumeSchema.parse(resumeData);

    // Render the template
    const html = renderCompleteDocument(templateHtml, templateCss, validatedResume);

    return NextResponse.json({ html });
  } catch (error) {
    console.error('Template rendering error:', error);
    return NextResponse.json(
      { error: 'Failed to render template', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
