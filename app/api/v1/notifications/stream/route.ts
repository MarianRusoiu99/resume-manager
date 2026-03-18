import { auth } from '@/lib/auth';
import { addConnection, removeConnection, sendHeartbeat } from '@/lib/notifications/emitter';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

/**
 * SSE endpoint for real-time notifications
 */
export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  
  logger.info('SSE connection opened', { userId });
  
  // Set up SSE response headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
  });
  
  // Create the readable stream for SSE
  let controllerRef: ReadableStreamDefaultController | null = null;
  let heartbeatInterval: NodeJS.Timeout | null = null;
  
  const stream = new ReadableStream({
    async start(controller) {
      controllerRef = controller;
      
      // Register this connection (async for PubSub subscription)
      await addConnection(userId, controller);
      
      // Send initial connection message
      const encoder = new TextEncoder();
      const connectMessage = encoder.encode(
        `event: connected\ndata: ${JSON.stringify({ userId, timestamp: new Date().toISOString() })}\n\n`
      );
      controller.enqueue(connectMessage);
      
      // Set up heartbeat every 30 seconds to keep connection alive
      heartbeatInterval = setInterval(() => {
        sendHeartbeat(userId);
      }, 30000);
    },
    
    async cancel() {
      logger.info('SSE connection closed', { userId });
      // Clean up when client disconnects
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      if (controllerRef) {
        await removeConnection(userId, controllerRef);
      }
    },
  });
  
  return new Response(stream, { headers });
}
