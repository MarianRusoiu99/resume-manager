import { Queue, ConnectionOptions } from 'bullmq';
import { getRedisConfig } from '../redis/connection';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const queueConnection: ConnectionOptions = {
  ...getRedisConfig({ url: redisUrl }),
  // BullMQ requires this for its internal lua scripts
  maxRetriesPerRequest: null, 
};

export const PDF_QUEUE_NAME = 'pdf-generation';

export interface PdfJobData {
  resumeId: string;
  html: string;
  userId: string;
}

export interface PdfJobResult {
  success: boolean;
  pdfBase64?: string;
  error?: string;
}

// Global queue instance
let pdfQueue: Queue<PdfJobData, PdfJobResult> | undefined;

export function getPdfQueue() {
  if (!pdfQueue) {
    pdfQueue = new Queue(PDF_QUEUE_NAME, {
      connection: queueConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          age: 1800, // Keep for 30 minutes to allow download
          count: 100, // Keep last 100 jobs
        },
        removeOnFail: {
          age: 24 * 3600, // Keep failed jobs for 24 hours for debugging
        },
      },
    });
  }
  return pdfQueue;
}
