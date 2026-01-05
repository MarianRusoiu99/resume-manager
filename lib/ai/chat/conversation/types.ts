/**
 * Conversation types and state definitions
 */

import type { Message } from '../message';
import type { ConversationContext } from '../context';

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
 * Conversation snapshot for undo functionality
 */
export interface ConversationSnapshot {
  id: string;
  timestamp: Date;
  messages: Message[];
  output: unknown;
}
