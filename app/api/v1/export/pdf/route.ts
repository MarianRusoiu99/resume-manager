import { NextRequest, NextResponse } from 'next/server';
import { pdfService } from '@/lib/services/pdf/pdf.service';
import { renderTemplateClientSide } from '@/lib/utils/client-renderer';
import { logger } from '@/lib/utils/logger';
import { createApiHandler } from '@/lib/api/handler';
import { pdfExportSchema } from '@/lib/validations/api-schemas';

export const POST = createApiHandler(
  async (request, context, session, body) => {
    const { resume, template, fileName } = body!;

    // Render the final HTML
    const html = renderTemplateClientSide({
      htmlTemplate: template.htmlTemplate,
      resumeData: resume,
    });

    // Generate PDF
    const pdfBuffer = await pdfService.generateFromHtml(html);

    // Create a Blob-like response from the buffer
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  },
  {
    isPublic: false,
    rateLimit: 'pdfExport',
    bodySchema: pdfExportSchema,
  }
);
