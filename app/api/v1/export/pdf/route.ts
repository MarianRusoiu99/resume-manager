import { NextRequest, NextResponse } from 'next/server';
import { getPdfQueue } from '@/lib/queue/pdf-queue';
import { renderCompleteDocument } from '@/lib/templates/renderer';
import { logger } from '@/lib/utils/logger';
import { createApiHandler } from '@/lib/api/handler';
import { pdfExportSchema } from '@/lib/validations/api-schemas';

export const POST = createApiHandler(
  async (request, context, session, body) => {
    const { resume, template, fileName } = body!;

    // Render the final HTML
    const html = renderCompleteDocument(template.htmlTemplate, resume);

    // Instead of generating the PDF synchronously, we offload it to the queue
    const queue = getPdfQueue();
    const job = await queue.add('generate-pdf', {
      resumeId: (resume as any).id || 'new-resume',
      html,
      userId: session.user.id,
    });

    logger.info(`Offloaded PDF generation to worker`, { jobId: job.id, userId: session.user.id });

    // Return the jobId so the client can track progress
    return NextResponse.json({ 
      success: true, 
      message: 'PDF generation started in background',
      jobId: job.id 
    });
  },
  {
    isPublic: false,
    rateLimit: 'pdfExport',
    bodySchema: pdfExportSchema,
  }
);
