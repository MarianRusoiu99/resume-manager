import { Worker, Job } from 'bullmq';
import { queueConnection, PDF_QUEUE_NAME, PdfJobData, PdfJobResult } from '../pdf-queue';
import { pdfService } from '@/lib/services/pdf/pdf.service';
import { logger } from '@/lib/utils/logger';

export function createPdfWorker() {
  const worker = new Worker<PdfJobData, PdfJobResult>(
    PDF_QUEUE_NAME,
    async (job: Job<PdfJobData>) => {
      const { html, resumeId, userId } = job.data;
      
      logger.info(`Starting PDF generation for resume ${resumeId}`, { job: job.id, userId });
      
      try {
        const buffer = await pdfService.generateFromHtml(html);
        
        // Here you would typically upload to S3 or update a database record
        // For now, we return a success signal.
        // In a real implementation, you'd store the result and notify the user via Redis PubSub or DB
        
        logger.info(`Completed PDF generation for resume ${resumeId}`, { job: job.id });
        
        return { success: true } as any;
      } catch (error) {
        logger.error(`PDF generation failed for job ${job.id}`, error);
        throw error; // Let BullMQ handle retries
      }
    },
    { 
      connection: queueConnection,
      concurrency: 2, // Limit concurrent Puppeteer instances
    }
  );

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed`, err);
  });

  return worker;
}
