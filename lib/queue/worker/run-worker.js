/**
 * PDF Worker Entrypoint
 * 
 * This script initializes the BullMQ worker for PDF generation.
 */
// In production, we assume environment variables are provided by the container orchestrator
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// In Next.js standalone build, we use the bundled files. 
// If we are running in the worker container, we might need ts-node 
// ONLY if we haven't pre-compiled the worker. 
// Since Next.js doesn't bundle the worker automatically, we use jiti or ts-node 
// but jiti is safer/faster for production "scripts" that aren't part of the main bundle.

const { createPdfWorker } = require('./pdf-worker');
const { logger } = require('../../utils/logger');

logger.info('Starting PDF Generation Worker...');

const worker = createPdfWorker();

process.on('SIGTERM', async () => {
  logger.info('Shutting down worker (SIGTERM)...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Interrupted (SIGINT), shutting down...');
  await worker.close();
  process.exit(0);
});
