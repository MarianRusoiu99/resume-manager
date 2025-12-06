/**
 * Server-side Notification Emitter
 * 
 * This module manages SSE connections and broadcasts notifications to connected clients.
 * Uses Redis PubSub for cross-instance communication in production.
 * Falls back to in-memory for single-instance deployments.
 */

import { NotificationType } from '@prisma/client';
import { getPubSubProvider } from '@/lib/redis';

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
 * Channel name for notification pubsub
 */
const NOTIFICATION_CHANNEL_PREFIX = 'notifications:';

/**
 * Get the channel name for a user
 */
function getChannelName(userId: string): string {
  return `${NOTIFICATION_CHANNEL_PREFIX}${userId}`;
}

/**
 * Global store for connected SSE clients on THIS instance
 * Maps userId → Set of controllers (user can have multiple tabs)
 */
const connectedClients = new Map<string, Set<ConnectedClient>>();

/**
 * Track if we've subscribed to Redis for each user
 */
const subscribedUsers = new Map<string, () => void | Promise<void>>();

/**
 * Initialize PubSub subscription for a user
 */
async function ensureSubscribed(userId: string): Promise<void> {
  if (subscribedUsers.has(userId)) return;
  
  const pubsub = getPubSubProvider();
  const channel = getChannelName(userId);
  
  // Subscribe to Redis channel for this user
  const unsubscribe = await pubsub.subscribe<NotificationPayload>(channel, (_, notification) => {
    // When we receive a message from Redis, broadcast to local SSE clients
    broadcastToLocalClients(userId, notification);
  });
  
  subscribedUsers.set(userId, unsubscribe);
  console.log(`[SSE] Subscribed to PubSub channel: ${channel}`);
}

/**
 * Unsubscribe from PubSub for a user (when no more local clients)
 */
async function unsubscribeIfNoClients(userId: string): Promise<void> {
  const userClients = connectedClients.get(userId);
  if (userClients && userClients.size > 0) return;
  
  const unsubscribe = subscribedUsers.get(userId);
  if (unsubscribe) {
    await unsubscribe();
    subscribedUsers.delete(userId);
    console.log(`[SSE] Unsubscribed from PubSub channel: ${getChannelName(userId)}`);
  }
}

/**
 * Broadcast notification to local SSE clients only (called by PubSub handler)
 */
function broadcastToLocalClients(userId: string, notification: NotificationPayload): void {
  const userClients = connectedClients.get(userId);
  if (!userClients || userClients.size === 0) return;
  
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
  
  if (successCount > 0) {
    console.log(`[SSE] Broadcast to ${successCount} local clients for user ${userId}`);
  }
}

/**
 * Add a new SSE connection for a user
 */
export async function addConnection(userId: string, controller: ReadableStreamDefaultController): Promise<void> {
  if (!connectedClients.has(userId)) {
    connectedClients.set(userId, new Set());
  }
  
  const client: ConnectedClient = {
    controller,
    userId,
    connectedAt: new Date(),
  };
  
  connectedClients.get(userId)!.add(client);
  
  // Ensure we're subscribed to PubSub for this user
  await ensureSubscribed(userId);
  
  console.log(`[SSE] Client connected for user ${userId}. Total local connections: ${connectedClients.get(userId)!.size}`);
}

/**
 * Remove an SSE connection for a user
 */
export async function removeConnection(userId: string, controller: ReadableStreamDefaultController): Promise<void> {
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
    // Unsubscribe from PubSub if no more local clients
    await unsubscribeIfNoClients(userId);
  }
  
  console.log(`[SSE] Client disconnected for user ${userId}. Remaining: ${userClients?.size ?? 0}`);
}

/**
 * Emit a notification to all instances via PubSub
 * This will reach all connected clients across all server instances
 */
export async function emitNotification(userId: string, notification: NotificationPayload): Promise<void> {
  const pubsub = getPubSubProvider();
  const channel = getChannelName(userId);
  
  // Publish to PubSub - all subscribed instances will receive this
  await pubsub.publish(channel, notification);
  
  console.log(`[SSE] Published notification to channel: ${channel}`);
}

/**
 * Send a heartbeat to keep connections alive (local only)
 */
export function sendHeartbeat(userId: string): void {
  const userClients = connectedClients.get(userId);
  if (!userClients) return;
  
  const eventData = `event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`;
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(eventData);
  
  const failedClients: ConnectedClient[] = [];
  
  for (const client of userClients) {
    try {
      client.controller.enqueue(encodedData);
    } catch {
      failedClients.push(client);
    }
  }
  
  // Clean up failed connections
  for (const client of failedClients) {
    userClients.delete(client);
  }
}

/**
 * Get connection stats (for debugging/monitoring)
 */
export function getConnectionStats(): {
  totalUsers: number;
  totalConnections: number;
  subscribedChannels: number;
} {
  let totalConnections = 0;
  for (const clients of connectedClients.values()) {
    totalConnections += clients.size;
  }
  return {
    totalUsers: connectedClients.size,
    totalConnections,
    subscribedChannels: subscribedUsers.size,
  };
}

/**
 * Graceful shutdown - clean up all connections and subscriptions
 */
export async function shutdown(): Promise<void> {
  // Unsubscribe from all PubSub channels
  for (const unsub of subscribedUsers.values()) {
    await unsub();
  }
  subscribedUsers.clear();
  
  // Close all SSE connections
  for (const [, clients] of connectedClients) {
    for (const client of clients) {
      try {
        client.controller.close();
      } catch {
        // Already closed
      }
    }
    clients.clear();
  }
  connectedClients.clear();
  
  console.log('[SSE] Shutdown complete');
}
