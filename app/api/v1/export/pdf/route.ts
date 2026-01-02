/**
 * Universal PDF Export API
 * POST /api/export/pdf
 * Generates PDF from any resume data and template
 */

import { NextResponse } from 'next/server';

import { createApiHandler } from '@/lib/api/handler';
import { renderCompleteDocument } from '@/lib/templates/renderer';
import { pdfService, DEFAULT_PDF_CONFIG } from '@/lib/services/pdf/pdf.service';
import { resumeSchema, type Resume } from '@/lib/validations/jsonresume';
import { z } from 'zod';

// Request schema validation
const exportRequestSchema = z.object({
  resume: z.unknown(),
  template: z.object({
    htmlTemplate: z.string(),
    cssStyles: z.string(),
  }),
  fileName: z.string().optional(),
});

export const POST = createApiHandler(
  async (_request, _context, _session, body) => {
    const { resume, template, fileName } = body!;

    const parsedResume = resumeSchema.parse(resume) as Resume;

    // Render HTML using template renderer (renderer sanitizes template HTML/CSS)
    const html = renderCompleteDocument(
      template.htmlTemplate,
      template.cssStyles,
      parsedResume
    );

    const pdfBuffer = await pdfService.generateFromHtml(html, DEFAULT_PDF_CONFIG);

    // Generate filename from resume data or use provided name
    const defaultFileName = parsedResume.basics?.name?.replaceAll(/\s+/g, '_') || 'resume';
    const finalFileName = fileName || `${defaultFileName}.pdf`;

    // Return PDF with proper headers
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${finalFileName}"`,
        'Cache-Control': 'no-cache',
      },
    });
  },
  { bodySchema: exportRequestSchema }
);
