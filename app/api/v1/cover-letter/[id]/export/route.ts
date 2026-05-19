import { NextResponse } from 'next/server';
import { pdfService } from '@/lib/services/pdf/pdf.service';
import { coverLetterService } from '@/lib/services';
import { createApiHandler, ServiceError } from '@/lib/api/handler';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export const POST = createApiHandler(async (_request, context, session) => {
  const { id } = await context.params;

  // Fetch cover letter content
  const result = await coverLetterService.getCoverLetter(id, session.user.id);
  if (!result.success) {
    throw new ServiceError('Cover letter not found', 'NOT_FOUND');
  }

  const coverLetter = result.data;
  const safeContent = escapeHtml(coverLetter.content);
  const safeId = id.replaceAll(/[^a-zA-Z0-9_-]/g, '_');

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
      <div class="content">${safeContent}</div>
    </body>
    </html>
  `;

  const pdfBuffer = await pdfService.generateFromHtml(html);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cover-letter-${safeId}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}, {
  isPublic: false,
  rateLimit: 'pdfExport',
  verifyUser: true,
});
