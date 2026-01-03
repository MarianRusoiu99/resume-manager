/**
 * In-memory conversation storage
 */

import { generateId } from 'ai';
import { Conversation, ConversationSnapshot } from './types';

export class ConversationStore {
  private conversations: Map<string, Conversation> = new Map();
  private snapshots: Map<string, ConversationSnapshot[]> = new Map();
  private maxSnapshots = 10;

  get(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  set(id: string, conversation: Conversation): void {
    this.conversations.set(id, conversation);
  }

  delete(id: string): boolean {
    this.snapshots.delete(id);
    return this.conversations.delete(id);
  }

  has(id: string): boolean {
    return this.conversations.has(id);
  }

  saveSnapshot(conversationId: string): void {
    const conversation = this.get(conversationId);
    if (!conversation) return;

    const existingSnapshots = this.snapshots.get(conversationId) || [];
    const snapshot: ConversationSnapshot = {
      id: generateId(),
      timestamp: new Date(),
      messages: [...conversation.messages],
      output: conversation.output ? JSON.parse(JSON.stringify(conversation.output)) : undefined,
    };

    existingSnapshots.push(snapshot);

    // Keep only the last N snapshots
    if (existingSnapshots.length > this.maxSnapshots) {
      existingSnapshots.shift();
    }

    this.snapshots.set(conversationId, existingSnapshots);
  }

  getSnapshots(conversationId: string): ConversationSnapshot[] {
    return this.snapshots.get(conversationId) || [];
  }

  restoreSnapshot(conversationId: string, snapshotId: string): boolean {
    const conversation = this.get(conversationId);
    const snapshots = this.snapshots.get(conversationId);
    
    if (!conversation || !snapshots) return false;

    const snapshotIndex = snapshots.findIndex(s => s.id === snapshotId);
    if (snapshotIndex === -1) return false;

    const snapshot = snapshots[snapshotIndex];
    conversation.messages = [...snapshot.messages];
    conversation.output = snapshot.output ? JSON.parse(JSON.stringify(snapshot.output)) : undefined;
    conversation.metadata.updatedAt = new Date();
    conversation.metadata.messageCount = conversation.messages.length;

    // Remove snapshots after the restored one
    this.snapshots.set(conversationId, snapshots.slice(0, snapshotIndex));

    return true;
  }

  undoLast(conversationId: string): boolean {
    const snapshots = this.snapshots.get(conversationId);
    if (!snapshots || snapshots.length === 0) return false;

    const lastSnapshot = snapshots[snapshots.length - 1];
    return this.restoreSnapshot(conversationId, lastSnapshot.id);
  }
}

// Singleton store instance
export const conversationStore = new ConversationStore();
