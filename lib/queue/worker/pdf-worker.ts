import { Worker, Job } from 'bullmq';
import { queueConnection, PDF_QUEUE_NAME, PdfJobData, PdfJobResult } from '../pdf-queue';
import { pdfService } from '../../services/pdf/pdf.service';
import { logger } from '../../utils/logger';
import { emitNotification } from '../../notifications/emitter';
import { NotificationType } from '@prisma/client';

export function createPdfWorker() {
  const worker = new Worker<PdfJobData, PdfJobResult>(
    PDF_QUEUE_NAME,
    async (job: Job<PdfJobData>) => {
      const { resumeId, userId } = job.data;
      
      logger.info(`Starting PDF generation for resume ${resumeId}`, { job: job.id, userId });
      
      try {
        const { html } = job.data;
        const buffer = await pdfService.generateFromHtml(html);
        const pdfBase64 = buffer.toString('base64');
        
        logger.info(`Completed PDF generation for resume ${resumeId}`, { job: job.id });
        
        return { success: true, pdfBase64 };
      } catch (error) {
        logger.error(`PDF generation failed for job ${job.id}`, error);
        throw error;
      }
    },
    { 
      connection: queueConnection,
      concurrency: 2, 
    }
  );

  worker.on('completed', async (job) => {
    const { resumeId, userId } = job.data;
    const result = job.returnvalue;

    if (result?.success) {
      // Notify user via SSE/Redis PubSub
      await emitNotification(userId, {
        id: `pdf-${job.id}`,
        type: NotificationType.EXPORT_COMPLETE,
        title: 'PDF Ready',
        message: 'Your resume PDF has been generated successfully and download has started.',
        createdAt: new Date().toISOString(),
        metadata: {
          jobId: job.id,
          resumeId,
          status: 'completed'
        }
      });
    }
  });

  worker.on('failed', async (job, err) => {
    logger.error(`Job ${job?.id} failed`, err);

    if (job) {
      const { resumeId, userId } = job.data;
      // Notify user of failure
      await emitNotification(userId, {
        id: `pdf-err-${job.id}`,
        type: NotificationType.SYSTEM,
        title: 'PDF Generation Failed',
        message: 'There was an error generating your resume PDF. Please try again.',
        createdAt: new Date().toISOString(),
        metadata: {
          jobId: job.id,
          resumeId,
          status: 'failed'
        }
      });
    }
  });

  return worker;
}
