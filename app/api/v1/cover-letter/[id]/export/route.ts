import { NextRequest, NextResponse } from 'next/server';
import { pdfService } from '@/lib/services/pdf/pdf.service';
import { logger } from '@/lib/utils/logger';
import { coverLetterService } from '@/lib/services';

import { auth } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Fetch cover letter content
    const result = await coverLetterService.getCoverLetter(id, session.user.id);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Cover letter not found' },
        { status: 404 }
      );
    }

    const coverLetter = result.data;
    
    // Minimal HTML wrapper for the cover letter
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            padding: 2rem;
            max-width: 800px;
            margin: 0 auto;
          }
          .content {
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <div class="content">${coverLetter.content}</div>
      </body>
      </html>
    `;

    // Generate PDF
    const pdfBuffer = await pdfService.generateFromHtml(html);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cover-letter-${id}.pdf"`,
      },
    });
  } catch (error) {
    logger.error('API Cover Letter Export Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
