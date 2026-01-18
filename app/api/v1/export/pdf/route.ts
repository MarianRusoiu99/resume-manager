import { NextResponse } from 'next/server';
import { renderCompleteDocument } from '@/lib/templates/renderer';
import { logger } from '@/lib/utils/logger';
import { createApiHandler } from '@/lib/api/handler';
import { pdfExportSchema, type PdfExportInput } from '@/lib/validations/api-schemas';
import { pdfService } from '@/lib/services/pdf/pdf.service';

export const POST = createApiHandler<unknown, PdfExportInput>(
  async (request, context, session, body) => {
    const { resume, template, fileName } = body!;

    try {
      logger.info(`Starting PDF generation for user ${session.user.id}`);

      const html = renderCompleteDocument(template.htmlTemplate, resume);
      const buffer = await pdfService.generateFromHtml(html);
      
      const finalFileName = fileName || 'resume.pdf';

      logger.info(`Successfully generated PDF for user ${session.user.id}`, { 
        fileName: finalFileName, 
        bufferSize: buffer.length 
      });

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${finalFileName}"`,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } catch (error) {
      logger.error('Failed to generate PDF', error);
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
