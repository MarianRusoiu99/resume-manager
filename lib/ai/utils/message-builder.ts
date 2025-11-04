/**
 * Message Builder Utilities
 * 
 * Clean utilities for creating and managing LangChain messages
 */

import { AIMessage, HumanMessage, SystemMessage, BaseMessage } from '@langchain/core/messages';

/**
 * Create a system message with consistent formatting
 */
export function createSystemMessage(content: string): SystemMessage {
  return new SystemMessage({
    content: content.trim()
  });
}

/**
 * Create a human/user message
 */
export function createHumanMessage(content: string): HumanMessage {
  return new HumanMessage({
    content: content.trim()
  });
}

/**
 * Create an AI assistant message
 */
export function createAIMessage(content: string): AIMessage {
  return new AIMessage({
    content: content.trim()
  });
}

/**
 * Create a conversation history from an array of message objects
 */
export interface SimpleMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function createConversationHistory(messages: SimpleMessage[]): BaseMessage[] {
  return messages.map(msg => {
    switch (msg.role) {
      case 'system':
        return createSystemMessage(msg.content);
      case 'user':
        return createHumanMessage(msg.content);
      case 'assistant':
        return createAIMessage(msg.content);
      default:
        throw new Error(`Unknown message role: ${msg.role}`);
    }
  });
}

/**
 * Format messages for logging/display
 */
export function formatMessagesForLog(messages: BaseMessage[]): string {
  return messages
    .map((msg, idx) => {
      const role = msg._getType().toUpperCase();
      const content = typeof msg.content === 'string' 
        ? msg.content 
        : JSON.stringify(msg.content);
      
      const preview = content.length > 100 
        ? `${content.substring(0, 100)}...` 
        : content;
      
      return `[${idx + 1}] ${role}: ${preview}`;
    })
    .join('\n');
}

/**
 * Extract text content from a message, handling different content types
 */
export function extractTextContent(message: BaseMessage): string {
  if (typeof message.content === 'string') {
    return message.content;
  }
  
  if (Array.isArray(message.content)) {
    return message.content
      .filter(item => typeof item === 'string' || item.type === 'text')
      .map(item => typeof item === 'string' ? item : item.text)
      .join('\n');
  }
  
  return JSON.stringify(message.content);
}

/**
 * Count total characters in message history
 */
export function countMessageCharacters(messages: BaseMessage[]): number {
  return messages.reduce((total, msg) => {
    return total + extractTextContent(msg).length;
  }, 0);
}

/**
 * Truncate message history to fit within character limit
 * Keeps system messages and recent messages, removes old ones
 */
export function truncateMessageHistory(
  messages: BaseMessage[],
  maxCharacters: number
): BaseMessage[] {
  // Always keep system messages
  const systemMessages = messages.filter(msg => msg._getType() === 'system');
  const otherMessages = messages.filter(msg => msg._getType() !== 'system');
  
  // Start with system messages
  const result: BaseMessage[] = [...systemMessages];
  let currentChars = countMessageCharacters(systemMessages);
  
  // Add messages from most recent to oldest until we hit the limit
  for (let i = otherMessages.length - 1; i >= 0; i--) {
    const msg = otherMessages[i];
    const msgChars = extractTextContent(msg).length;
    
    if (currentChars + msgChars <= maxCharacters) {
      result.push(msg);
      currentChars += msgChars;
    } else {
      break;
    }
  }
  
  // Return in original order
  return result.sort((a, b) => {
    const aIdx = messages.indexOf(a);
    const bIdx = messages.indexOf(b);
    return aIdx - bIdx;
  });
}
