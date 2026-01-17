"use strict";
/**
 * Server-side Notification Emitter
 *
 * Facade over:
 * - local in-memory SSE fan-out (this instance)
 * - Redis PubSub for cross-instance delivery
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addConnection = addConnection;
exports.removeConnection = removeConnection;
exports.emitNotification = emitNotification;
exports.sendHeartbeat = sendHeartbeat;
exports.getConnectionStats = getConnectionStats;
exports.shutdown = shutdown;
const redis_1 = require("../redis");
const logger_1 = require("../utils/logger");
const sse_hub_1 = require("./sse-hub");
const NOTIFICATION_CHANNEL_PREFIX = 'notifications:';
function getChannelName(userId) {
    return `${NOTIFICATION_CHANNEL_PREFIX}${userId}`;
}
const hub = new sse_hub_1.SseHub();
const subscribedUsers = new Map();
/**
 * Initialize PubSub subscription for a user
 */
async function ensureSubscribed(userId) {
    if (subscribedUsers.has(userId))
        return;
    const pubsub = (0, redis_1.getPubSubProvider)();
    const channel = getChannelName(userId);
    // Subscribe to Redis channel for this user
    const unsubscribe = await pubsub.subscribe(channel, (ch, notification) => {
        console.log(`[SSE Emitter] Received message from PubSub on channel ${ch}`, notification);
        hub.broadcast(userId, 'notification', notification);
    });
    subscribedUsers.set(userId, unsubscribe);
    logger_1.logger.info('SSE subscribed to PubSub channel', { userId, channel });
}
/**
 * Unsubscribe from PubSub for a user (when no more local clients)
 */
async function unsubscribeIfNoClients(userId) {
    if (hub.hasLocalClients(userId))
        return;
    const unsubscribe = subscribedUsers.get(userId);
    if (unsubscribe) {
        await unsubscribe();
        subscribedUsers.delete(userId);
        logger_1.logger.info('SSE unsubscribed from PubSub channel', { userId, channel: getChannelName(userId) });
    }
}
/**
 * Add a new SSE connection for a user
 */
async function addConnection(userId, controller) {
    const count = hub.addConnection(userId, controller);
    await ensureSubscribed(userId);
    logger_1.logger.info('SSE client connected', { userId, count });
}
/**
 * Remove an SSE connection for a user
 */
async function removeConnection(userId, controller) {
    const remaining = hub.removeConnection(userId, controller);
    if (remaining === 0) {
        await unsubscribeIfNoClients(userId);
    }
    logger_1.logger.info('SSE client disconnected', { userId, remaining });
}
/**
 * Emit a notification to all instances via PubSub
 * This will reach all connected clients across all server instances
 */
async function emitNotification(userId, notification) {
    const pubsub = (0, redis_1.getPubSubProvider)();
    const channel = getChannelName(userId);
    // Publish to PubSub - all subscribed instances will receive this
    await pubsub.publish(channel, notification);
    logger_1.logger.info('SSE published notification', { userId, channel, type: notification.type });
}
/**
 * Send a heartbeat to keep connections alive (local only)
 */
function sendHeartbeat(userId) {
    hub.heartbeat(userId);
}
/**
 * Get connection stats (for debugging/monitoring)
 */
function getConnectionStats() {
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
async function shutdown() {
    // Unsubscribe from all PubSub channels
    for (const unsub of subscribedUsers.values()) {
        await unsub();
    }
    subscribedUsers.clear();
    hub.closeAll();
    logger_1.logger.info('SSE shutdown complete');
}
