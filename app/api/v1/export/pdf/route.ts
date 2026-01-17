import { NextResponse } from 'next/server';
import { renderCompleteDocument } from '@/lib/templates/renderer';
import { logger } from '@/lib/utils/logger';
import { createApiHandler } from '@/lib/api/handler';
import { pdfExportSchema, type PdfExportInput } from '@/lib/validations/api-schemas';
import { getPdfQueue } from '@/lib/queue/pdf-queue';
import { pdfService } from '@/lib/services/pdf/pdf.service';

export const POST = createApiHandler<unknown, PdfExportInput>(
  async (request, context, session, body) => {
    const { resume, template } = body!;

    try {
      // Render the final HTML
      const html = renderCompleteDocument(template.htmlTemplate, resume);

      // In development mode (without a dedicated worker), we can choose to process synchronously
      // or use the integrated worker. 
      const isDev = process.env.NODE_ENV === 'development';
      const forceSync = request.headers.get('X-Export-Mode') === 'sync';

      if (isDev && forceSync) {
        logger.info(`Sync PDF generation for user ${session.user.id}`);
        const buffer = await pdfService.generateFromHtml(html);
        
        return new NextResponse(buffer as any, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="resume-${(resume as any).id || 'export'}.pdf"`,
            'Content-Length': buffer.length.toString(),
          },
        });
      }

      // Get the queue instance
      const pdfQueue = getPdfQueue();

      // Enqueue the job for background processing
      const job = await pdfQueue.add('generate-pdf', {
        resumeId: (resume as any).id || 'unsaved',
        html,
        userId: session.user.id,
      });

      logger.info(`Enqueued PDF generation job ${job.id} for user ${session.user.id}`);

      // Return 202 Accepted with the job ID
      return NextResponse.json(
        { 
          message: 'PDF generation started', 
          jobId: job.id,
          status: 'pending' 
        },
        { 
          status: 202,
        }
      );
    } catch (error) {
      logger.error('Failed to enqueue PDF generation job', error);
      return NextResponse.json(
        { error: 'Failed to start PDF generation' },
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

export const GET = createApiHandler(
  async (request, context, session) => {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const pdfQueue = getPdfQueue();
    const job = await pdfQueue.getJob(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const state = await job.getState();

    if (state === 'failed') {
      return NextResponse.json({ error: 'PDF generation failed', details: job.failedReason }, { status: 500 });
    }

    if (state !== 'completed') {
      return NextResponse.json({ status: state }, { status: 202 });
    }

    const result = job.returnvalue;
    if (!result || !result.pdfBase64) {
      return NextResponse.json({ error: 'PDF data not available' }, { status: 500 });
    }

    try {
      const buffer = Buffer.from(result.pdfBase64, 'base64');
      
      // Basic PDF validation: Must start with %PDF-
      if (buffer.length < 5 || buffer.toString('utf8', 0, 5) !== '%PDF-') {
        logger.error(`Invalid PDF data for job ${jobId}`);
        return NextResponse.json({ error: 'Generated PDF is invalid or corrupted' }, { status: 500 });
      }

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="resume-${job.data.resumeId}.pdf"`,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } catch (error) {
      logger.error(`Error processing PDF buffer for job ${jobId}`, error);
      return NextResponse.json({ error: 'Failed to process PDF data' }, { status: 500 });
    }
  },
  { isPublic: false }
);
