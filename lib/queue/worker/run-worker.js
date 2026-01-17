/**
 * PDF Worker Entrypoint
 * 
 * This script initializes the BullMQ worker for PDF generation.
 */
require('dotenv').config();
const { createPdfWorker } = require('../../dist/lib/queue/worker/pdf-worker');
const { logger } = require('../../dist/lib/utils/logger');

logger.info('Starting PDF Generation Worker...');

const worker = createPdfWorker();

process.on('SIGTERM', async () => {
  logger.info('Shutting down worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Interrupted, shutting down...');
  await worker.close();
  process.exit(0);
});
