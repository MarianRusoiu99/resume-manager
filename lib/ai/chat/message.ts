/**
 * Message Types for AI Chat System
 *
 * Defines the structure of messages in a conversation
 */

import { generateId } from 'ai';

/**
 * Types of attachments that can be added to messages
 */
export type AttachmentType = 'document' | 'image' | 'resume' | 'job-description' | 'template';

/**
 * File attachment in a message
 */
export interface Attachment {
  id: string;
  type: AttachmentType;
  name: string;
  /** Extracted text content or base64 for images */
  content: string;
  mimeType: string;
  /** Original file size in bytes */
  size?: number;
  /** Additional metadata (e.g., page count for PDFs) */
  metadata?: Record<string, unknown>;
}

/**
 * Tool call made by the AI
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * Result from a tool execution
 */
export interface ToolResult {
  toolCallId: string;
  result: unknown;
  isError?: boolean;
}

/**
 * Role of a message in the conversation
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * A single message in the conversation
 */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  /** Attachments referenced in this message */
  attachments?: Attachment[];
  /** Tool calls made by assistant */
  toolCalls?: ToolCall[];
  /** Results from tool execution */
  toolResults?: ToolResult[];
  timestamp: Date;
}

/**
 * Creates a new user message
 */
export function createUserMessage(content: string, attachments?: Attachment[]): Message {
  return {
    id: generateId(),
    role: 'user',
    content,
    attachments,
    timestamp: new Date(),
  };
}

/**
 * Creates a new assistant message
 */
export function createAssistantMessage(
  content: string,
  toolCalls?: ToolCall[]
): Message {
  return {
    id: generateId(),
    role: 'assistant',
    content,
    toolCalls,
    timestamp: new Date(),
  };
}

/**
 * Creates a new system message
 */
export function createSystemMessage(content: string): Message {
  return {
    id: generateId(),
    role: 'system',
    content,
    timestamp: new Date(),
  };
}

/**
 * Creates a tool result message
 */
export function createToolMessage(toolResults: ToolResult[]): Message {
  return {
    id: generateId(),
    role: 'tool',
    content: '',
    toolResults,
    timestamp: new Date(),
  };
}

/**
 * Formats attachments as context for the AI
 */
export function formatAttachmentsAsContext(attachments: Attachment[]): string {
  if (!attachments.length) return '';

  const parts = attachments.map((att) => {
    const header = `--- ${att.type.toUpperCase()}: ${att.name} ---`;
    
    if (att.type === 'image') {
      // For images, we don't include the base64 content in text context
      // It's handled separately in the vision API
      return `${header}\n[Image attached - ${att.mimeType}]`;
    }
    
    return `${header}\n${att.content}`;
  });

  return parts.join('\n\n');
}

/**
 * Checks if attachments contain any images
 */
export function hasImageAttachments(attachments?: Attachment[]): boolean {
  return attachments?.some((att) => att.type === 'image') ?? false;
}

/**
 * Gets image attachments formatted for vision API
 */
export function getImageAttachments(attachments?: Attachment[]): Attachment[] {
  return attachments?.filter((att) => att.type === 'image') ?? [];
}

/**
 * Gets text-based attachments
 */
export function getTextAttachments(attachments?: Attachment[]): Attachment[] {
  return attachments?.filter((att) => att.type !== 'image') ?? [];
}
