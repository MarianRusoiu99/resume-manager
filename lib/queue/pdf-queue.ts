import { Queue, Worker, Job, ConnectionOptions } from 'bullmq';
import { getRedisConfig } from '@/lib/redis/connection';

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
  s3Url?: string; // If you plan to store it
  buffer?: Buffer; // Or just the raw data for internal transfer
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
        removeOnComplete: true,
      },
    });
  }
  return pdfQueue;
}
