/**
 * Server-side Notification Emitter
 * 
 * This module manages SSE connections and broadcasts notifications to connected clients.
 * Each user has their own set of connections (they might have multiple tabs open).
 */

import { NotificationType } from '@prisma/client';

/**
 * Notification payload structure for SSE events
 */
export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Connected client information
 */
interface ConnectedClient {
  controller: ReadableStreamDefaultController;
  userId: string;
  connectedAt: Date;
}

/**
 * Global store for connected SSE clients
 * Maps odix → Set of controllers (user can have multiple tabs)
 */
const connectedClients = new Map<string, Set<ConnectedClient>>();

/**
 * Add a new SSE connection for a user
 */
export function addConnection(userId: string, controller: ReadableStreamDefaultController): void {
  if (!connectedClients.has(userId)) {
    connectedClients.set(userId, new Set());
  }
  
  const client: ConnectedClient = {
    controller,
    userId,
    connectedAt: new Date(),
  };
  
  connectedClients.get(userId)!.add(client);
  console.log(`[SSE] Client connected for user ${userId}. Total connections: ${connectedClients.get(userId)!.size}`);
}

/**
 * Remove an SSE connection for a user
 */
export function removeConnection(userId: string, controller: ReadableStreamDefaultController): void {
  const userClients = connectedClients.get(userId);
  if (!userClients) return;
  
  for (const client of userClients) {
    if (client.controller === controller) {
      userClients.delete(client);
      break;
    }
  }
  
  if (userClients.size === 0) {
    connectedClients.delete(userId);
  }
  
  console.log(`[SSE] Client disconnected for user ${userId}. Remaining: ${userClients?.size ?? 0}`);
}

/**
 * Send a notification to all connected clients for a specific user
 */
export function emitNotification(userId: string, notification: NotificationPayload): void {
  const userClients = connectedClients.get(userId);
  if (!userClients || userClients.size === 0) {
    console.log(`[SSE] No connected clients for user ${userId}, notification will be fetched on next poll`);
    return;
  }
  
  const eventData = `event: notification\ndata: ${JSON.stringify(notification)}\n\n`;
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(eventData);
  
  let successCount = 0;
  const failedClients: ConnectedClient[] = [];
  
  for (const client of userClients) {
    try {
      client.controller.enqueue(encodedData);
      successCount++;
    } catch (error) {
      console.error(`[SSE] Failed to send to client:`, error);
      failedClients.push(client);
    }
  }
  
  // Clean up failed connections
  for (const client of failedClients) {
    userClients.delete(client);
  }
  
  console.log(`[SSE] Notification sent to ${successCount}/${userClients.size} clients for user ${userId}`);
}

/**
 * Send a heartbeat to keep connections alive
 */
export function sendHeartbeat(userId: string): void {
  const userClients = connectedClients.get(userId);
  if (!userClients) return;
  
  const eventData = `event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`;
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(eventData);
  
  for (const client of userClients) {
    try {
      client.controller.enqueue(encodedData);
    } catch {
      // Connection is dead, will be cleaned up on next emit
    }
  }
}

/**
 * Get connection stats (for debugging)
 */
export function getConnectionStats(): { totalUsers: number; totalConnections: number } {
  let totalConnections = 0;
  for (const clients of connectedClients.values()) {
    totalConnections += clients.size;
  }
  return {
    totalUsers: connectedClients.size,
    totalConnections,
  };
}
