/**
 * Conversation Manager
 *
 * Manages stateful AI conversations with message history and context
 */

import { generateId } from 'ai';
import type { Message, Attachment } from '../message';
import { createUserMessage, createAssistantMessage } from '../message';
import type { ConversationContext } from '../context';
import { createEmptyContext, mergeContext } from '../context';
import { Conversation, ConversationSnapshot, ConversationMode } from './types';
import { conversationStore } from './store';

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

    conversationStore.set(id, conversation);
    return conversation;
  }

  /**
   * Gets a conversation by ID
   */
  static get(id: string): Conversation | undefined {
    return conversationStore.get(id);
  }

  /**
   * Gets or creates a conversation
   */
  static getOrCreate(id: string | undefined, options: CreateConversationOptions): Conversation {
    if (id) {
      const existing = conversationStore.get(id);
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
    const conversation = conversationStore.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Save snapshot before adding message (for undo)
    conversationStore.saveSnapshot(conversationId);

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
    const conversation = conversationStore.get(conversationId);
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
    const conversation = conversationStore.get(conversationId);
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
    const conversation = conversationStore.get(conversationId);
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
    return conversationStore.undoLast(conversationId);
  }

  /**
   * Gets available undo snapshots
   */
  static getSnapshots(conversationId: string): ConversationSnapshot[] {
    return conversationStore.getSnapshots(conversationId);
  }

  /**
   * Restores to a specific snapshot
   */
  static restoreSnapshot(conversationId: string, snapshotId: string): boolean {
    return conversationStore.restoreSnapshot(conversationId, snapshotId);
  }

  /**
   * Deletes a conversation
   */
  static delete(conversationId: string): boolean {
    return conversationStore.delete(conversationId);
  }

  /**
   * Checks if a conversation exists
   */
  static exists(conversationId: string): boolean {
    return conversationStore.has(conversationId);
  }

  /**
   * Gets all messages in a conversation
   */
  static getMessages(conversationId: string): Message[] {
    const conversation = conversationStore.get(conversationId);
    return conversation?.messages || [];
  }

  /**
   * Gets the current output from a conversation
   */
  static getOutput<T>(conversationId: string): T | undefined {
    const conversation = conversationStore.get(conversationId);
    return conversation?.output as T | undefined;
  }

  /**
   * Clears messages but keeps context
   */
  static clearMessages(conversationId: string): void {
    const conversation = conversationStore.get(conversationId);
    if (!conversation) return;

    conversationStore.saveSnapshot(conversationId);
    conversation.messages = [];
    conversation.output = undefined;
    conversation.metadata.updatedAt = new Date();
    conversation.metadata.messageCount = 0;
  }
}
