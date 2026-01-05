/**
 * In-memory SSE hub for this server instance.
 * Manages local connections and fan-out of SSE events.
 */

export type SseController = ReadableStreamDefaultController;

interface ConnectedClient {
  controller: SseController;
  connectedAt: Date;
}

function encodeSseEvent(event: string, data: unknown): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export class SseHub {
  private readonly connectedClients = new Map<string, Set<ConnectedClient>>();

  addConnection(userId: string, controller: SseController): number {
    if (!this.connectedClients.has(userId)) {
      this.connectedClients.set(userId, new Set());
    }

    this.connectedClients.get(userId)!.add({
      controller,
      connectedAt: new Date(),
    });

    return this.connectedClients.get(userId)!.size;
  }

  removeConnection(userId: string, controller: SseController): number {
    const userClients = this.connectedClients.get(userId);
    if (!userClients) return 0;

    for (const client of userClients) {
      if (client.controller === controller) {
        userClients.delete(client);
        break;
      }
    }

    if (userClients.size === 0) {
      this.connectedClients.delete(userId);
      return 0;
    }

    return userClients.size;
  }

  broadcast(userId: string, event: string, data: unknown): number {
    const userClients = this.connectedClients.get(userId);
    if (!userClients || userClients.size === 0) return 0;

    const encoded = encodeSseEvent(event, data);
    const failedClients: ConnectedClient[] = [];
    let successCount = 0;

    for (const client of userClients) {
      try {
        client.controller.enqueue(encoded);
        successCount++;
        console.log(`[SSE Hub] Broadcast to user ${userId} successful`);
      } catch (err) {
        console.error(`[SSE Hub] Broadcast to user ${userId} failed:`, err);
        // Client connection is closed/broken - mark for cleanup
        // This is expected when clients disconnect unexpectedly
        failedClients.push(client);
      }
    }

    for (const client of failedClients) {
      userClients.delete(client);
    }

    if (userClients.size === 0) {
      this.connectedClients.delete(userId);
    }

    return successCount;
  }

  heartbeat(userId: string): void {
    this.broadcast(userId, 'heartbeat', { timestamp: new Date().toISOString() });
  }

  getStats(): { totalUsers: number; totalConnections: number } {
    let totalConnections = 0;
    for (const clients of this.connectedClients.values()) {
      totalConnections += clients.size;
    }
    return { totalUsers: this.connectedClients.size, totalConnections };
  }

  closeAll(): void {
    for (const [, clients] of this.connectedClients) {
      for (const client of clients) {
        try {
          client.controller.close();
        } catch {
          // Controller may already be closed - this is expected during cleanup
        }
      }
      clients.clear();
    }
    this.connectedClients.clear();
  }

  hasLocalClients(userId: string): boolean {
    const userClients = this.connectedClients.get(userId);
    return !!userClients && userClients.size > 0;
  }
}
