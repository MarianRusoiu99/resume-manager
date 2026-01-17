export async function register() {
  const isWorker = process.env.RUN_WORKER === 'true';
  const isDev = process.env.NODE_ENV === 'development';

  if (process.env.NEXT_RUNTIME === 'nodejs' && (isWorker || isDev)) {
    console.log(`[Instrumentation] Initializing PDF Worker (Mode: ${isWorker ? 'Dedicated' : 'Integrated/Dev'})...`);
    const { createPdfWorker } = await import('./lib/queue/worker/pdf-worker');
    createPdfWorker();
  }
}
