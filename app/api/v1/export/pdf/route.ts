import { NextResponse } from 'next/server';
import { renderCompleteDocument } from '@/lib/templates/renderer';
import { logger } from '@/lib/utils/logger';
import { createApiHandler } from '@/lib/api/handler';
import { pdfExportSchema } from '@/lib/validations/api-schemas';
import { pdfService } from '@/lib/services/pdf/pdf.service';

/**
 * Sanitizes a string for use as a filename
 */
function sanitizeFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/gi, '_') // Replace non-alphanumeric with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with one
    .trim()
    .replace(/^_+|_+$/g, ''); // Trim underscores from ends
}

export const POST = createApiHandler(
  async (request, context, session, body) => {
    const { resume, template } = body!;

    try {
      // Render the final HTML
      const html = renderCompleteDocument(template.htmlTemplate, resume);

      // Generate the PDF buffer synchronously
      const pdfBuffer = await pdfService.generateFromHtml(html);

      // Determine dynamic filename
      const personName = resume.basics?.name || 'Resume';
      const jobTitle = resume.basics?.label || '';
      
      const baseName = jobTitle 
        ? `${personName}_${jobTitle}`
        : personName;
      
      const fileName = `${sanitizeFilename(baseName)}.pdf`;

      logger.info(`Generated PDF for user ${session.user.id}`, { fileName });

      // Return the PDF as a binary stream
      return new NextResponse(pdfBuffer as any, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    } catch (error) {
      logger.error('PDF generation failed in API route', error);
      return NextResponse.json(
        { error: 'Failed to generate PDF' },
        { status: 500 }
      );
    }
  },
  {
    isPublic: false,
    rateLimit: 'pdfExport',
    bodySchema: pdfExportSchema,
  }
);
