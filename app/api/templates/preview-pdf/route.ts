/**
 * POST /api/templates/preview-html
 * Render HTML preview of template with sample data
 */

import { NextResponse } from 'next/server';
import { renderTemplate } from '@/lib/templates/renderer';
import { sampleResume } from '@/lib/utils/sample-resume';
import { logger } from '@/lib/utils/logger';

export async function POST(request: Request) {
  try {
    const { htmlTemplate, cssStyles } = await request.json();

    if (!htmlTemplate) {
      return NextResponse.json(
        { error: 'HTML template is required' },
        { status: 400 }
      );
    }

    // Render template with sample data
    const html = await renderTemplate(htmlTemplate, sampleResume);

    // Add CSS styles
    const styledHtml = `
      <style>${cssStyles || ''}</style>
      ${html}
    `;

    return NextResponse.json({
      success: true,
      html: styledHtml,
    });
  } catch (error) {
    logger.error('Failed to generate template preview', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate preview',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
