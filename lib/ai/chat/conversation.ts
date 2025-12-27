/**
 * Conversation Manager
 *
 * Manages stateful AI conversations with message history and context
 */

import { generateId } from 'ai';
import type { Message, Attachment } from './message';
import { createUserMessage, createAssistantMessage } from './message';
import type { ConversationContext } from './context';
import { createEmptyContext, mergeContext } from './context';

/**
 * Supported conversation modes
 */
export type ConversationMode =
  | 'resume-generation'
  | 'resume-enhancement'
  | 'cover-letter-generation'
  | 'template-generation'
  | 'template-enhancement'
  | 'text-enhancement';

/**
 * Conversation state
 */
export interface Conversation {
  id: string;
  mode: ConversationMode;
  messages: Message[];
  context: ConversationContext;
  /** Current structured output (depends on mode) */
  output: unknown;
  /** Conversation metadata */
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    messageCount: number;
  };
}

/**
 * Options for creating a new conversation
 */
export interface CreateConversationOptions {
  mode: ConversationMode;
  initialContext?: ConversationContext;
  /** Initial attachments to add to context */
  attachments?: Attachment[];
}

/**
 * Conversation snapshot for undo functionality
 */
export interface ConversationSnapshot {
  id: string;
  timestamp: Date;
  messages: Message[];
  output: unknown;
}

/**
 * In-memory conversation storage
 * In production, this could be replaced with Redis or database storage
 */
class ConversationStore {
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
const store = new ConversationStore();

/**
 * ConversationManager
 * 
 * Manages the lifecycle of AI conversations
 */
export class ConversationManager {
  /**
   * Creates a new conversation
   */
  static create(options: CreateConversationOptions): Conversation {
    const id = generateId();
    const now = new Date();

    const context = mergeContext(
      createEmptyContext(),
      {
        ...options.initialContext,
        attachments: options.attachments || options.initialContext?.attachments,
      }
    );

    const conversation: Conversation = {
      id,
      mode: options.mode,
      messages: [],
      context,
      output: undefined,
      metadata: {
        createdAt: now,
        updatedAt: now,
        messageCount: 0,
      },
    };

    store.set(id, conversation);
    return conversation;
  }

  /**
   * Gets a conversation by ID
   */
  static get(id: string): Conversation | undefined {
    return store.get(id);
  }

  /**
   * Gets or creates a conversation
   */
  static getOrCreate(id: string | undefined, options: CreateConversationOptions): Conversation {
    if (id) {
      const existing = store.get(id);
      if (existing) {
        // Update context if provided
        if (options.initialContext) {
          existing.context = mergeContext(existing.context, options.initialContext);
        }
        return existing;
      }
    }
    return this.create(options);
  }

  /**
   * Adds a user message to the conversation
   */
  static addUserMessage(
    conversationId: string,
    content: string,
    attachments?: Attachment[]
  ): Message {
    const conversation = store.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Save snapshot before adding message (for undo)
    store.saveSnapshot(conversationId);

    const message = createUserMessage(content, attachments);
    conversation.messages.push(message);
    conversation.metadata.updatedAt = new Date();
    conversation.metadata.messageCount = conversation.messages.length;

    // Add attachments to context
    if (attachments?.length) {
      conversation.context.attachments = [
        ...(conversation.context.attachments || []),
        ...attachments,
      ];
    }

    return message;
  }

  /**
   * Adds an assistant message to the conversation
   */
  static addAssistantMessage(
    conversationId: string,
    content: string,
    output?: unknown
  ): Message {
    const conversation = store.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const message = createAssistantMessage(content);
    conversation.messages.push(message);
    conversation.metadata.updatedAt = new Date();
    conversation.metadata.messageCount = conversation.messages.length;

    // Update output if provided
    if (output !== undefined) {
      conversation.output = output;
    }

    return message;
  }

  /**
   * Updates the conversation output
   */
  static setOutput(conversationId: string, output: unknown): void {
    const conversation = store.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    conversation.output = output;
    conversation.metadata.updatedAt = new Date();
  }

  /**
   * Updates conversation context
   */
  static updateContext(
    conversationId: string,
    contextUpdates: Partial<ConversationContext>
  ): void {
    const conversation = store.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    conversation.context = mergeContext(conversation.context, contextUpdates);
    conversation.metadata.updatedAt = new Date();
  }

  /**
   * Undoes the last message/change
   */
  static undo(conversationId: string): boolean {
    return store.undoLast(conversationId);
  }

  /**
   * Gets available undo snapshots
   */
  static getSnapshots(conversationId: string): ConversationSnapshot[] {
    return store.getSnapshots(conversationId);
  }

  /**
   * Restores to a specific snapshot
   */
  static restoreSnapshot(conversationId: string, snapshotId: string): boolean {
    return store.restoreSnapshot(conversationId, snapshotId);
  }

  /**
   * Deletes a conversation
   */
  static delete(conversationId: string): boolean {
    return store.delete(conversationId);
  }

  /**
   * Checks if a conversation exists
   */
  static exists(conversationId: string): boolean {
    return store.has(conversationId);
  }

  /**
   * Gets all messages in a conversation
   */
  static getMessages(conversationId: string): Message[] {
    const conversation = store.get(conversationId);
    return conversation?.messages || [];
  }

  /**
   * Gets the current output from a conversation
   */
  static getOutput<T>(conversationId: string): T | undefined {
    const conversation = store.get(conversationId);
    return conversation?.output as T | undefined;
  }

  /**
   * Clears messages but keeps context
   */
  static clearMessages(conversationId: string): void {
    const conversation = store.get(conversationId);
    if (!conversation) return;

    store.saveSnapshot(conversationId);
    conversation.messages = [];
    conversation.output = undefined;
    conversation.metadata.updatedAt = new Date();
    conversation.metadata.messageCount = 0;
  }
}

export { store as conversationStore };
