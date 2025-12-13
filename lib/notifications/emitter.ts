/**
 * Server-side Notification Emitter
 *
 * Facade over:
 * - local in-memory SSE fan-out (this instance)
 * - Redis PubSub for cross-instance delivery
 */

import { getPubSubProvider } from '@/lib/redis';
import { SseHub, type SseController } from './sse-hub';
export type { NotificationPayload } from './types';
import type { NotificationPayload } from './types';

const NOTIFICATION_CHANNEL_PREFIX = 'notifications:';
function getChannelName(userId: string): string {
  return `${NOTIFICATION_CHANNEL_PREFIX}${userId}`;
}

const hub = new SseHub();

/**
 * Track if we've subscribed to Redis for each user
 */
type UnsubscribeFn = () => void | Promise<void>;
const subscribedUsers = new Map<string, UnsubscribeFn>();

/**
 * Initialize PubSub subscription for a user
 */
async function ensureSubscribed(userId: string): Promise<void> {
  if (subscribedUsers.has(userId)) return;
  
  const pubsub = getPubSubProvider();
  const channel = getChannelName(userId);
  
  // Subscribe to Redis channel for this user
  const unsubscribe = await pubsub.subscribe<NotificationPayload>(channel, (_, notification) => {
    hub.broadcast(userId, 'notification', notification);
  });
  
  subscribedUsers.set(userId, unsubscribe);
  console.log(`[SSE] Subscribed to PubSub channel: ${channel}`);
}

/**
 * Unsubscribe from PubSub for a user (when no more local clients)
 */
async function unsubscribeIfNoClients(userId: string): Promise<void> {
  if (hub.hasLocalClients(userId)) return;
  
  const unsubscribe = subscribedUsers.get(userId);
  if (unsubscribe) {
    await unsubscribe();
    subscribedUsers.delete(userId);
    console.log(`[SSE] Unsubscribed from PubSub channel: ${getChannelName(userId)}`);
  }
}

/**
 * Add a new SSE connection for a user
 */
export async function addConnection(userId: string, controller: SseController): Promise<void> {
  const count = hub.addConnection(userId, controller);
  await ensureSubscribed(userId);
  console.log(`[SSE] Client connected for user ${userId}. Total local connections: ${count}`);
}

/**
 * Remove an SSE connection for a user
 */
export async function removeConnection(userId: string, controller: SseController): Promise<void> {
  const remaining = hub.removeConnection(userId, controller);
  if (remaining === 0) {
    await unsubscribeIfNoClients(userId);
  }
  console.log(`[SSE] Client disconnected for user ${userId}. Remaining: ${remaining}`);
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
  hub.heartbeat(userId);
}

/**
 * Get connection stats (for debugging/monitoring)
 */
export function getConnectionStats(): {
  totalUsers: number;
  totalConnections: number;
  subscribedChannels: number;
} {
  const { totalUsers, totalConnections } = hub.getStats();
  return {
    totalUsers,
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

  hub.closeAll();
  
  console.log('[SSE] Shutdown complete');
}
