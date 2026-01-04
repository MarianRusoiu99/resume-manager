import { NextRequest, NextResponse } from 'next/server';
import { pdfService } from '@/lib/services/pdf/pdf.service';
import { renderTemplateClientSide } from '@/lib/utils/client-renderer';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resume, template, fileName = 'resume.pdf' } = body;

    if (!resume || !template?.htmlTemplate) {
      return NextResponse.json(
        { error: 'Missing required fields: resume and template.htmlTemplate' },
        { status: 400 }
      );
    }

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
  } catch (error) {
    logger.error('API PDF Export Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
