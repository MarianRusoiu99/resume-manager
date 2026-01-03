import type { CoreMessage } from 'ai';
import type { Conversation } from '../conversation';
import type { AIMode } from '../../modes/types';
import { formatAttachmentsAsContext, getImageAttachments, getTextAttachments } from '../message';
import { formatContextForPrompt } from '../context';

/**
 * Builds messages array for AI (using CoreMessage format)
 */
export function buildMessages(conversation: Conversation, mode: AIMode): CoreMessage[] {
  const messages: CoreMessage[] = [];

  // Add context as first user message if not in conversation
  const contextString = formatContextForPrompt(conversation.context);
  if (contextString && conversation.messages.length === 0) {
    messages.push({
      role: 'user',
      content: `Here is the context for this conversation:\n\n${contextString}`,
    });
  }

  // Add conversation messages
  for (const msg of conversation.messages) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      let content = msg.content;

      // Preprocess user messages if mode has it
      if (msg.role === 'user' && mode.preprocessUserMessage) {
        content = mode.preprocessUserMessage(content, conversation.context);
      }

      // Add attachment context for user messages
      if (msg.role === 'user' && msg.attachments?.length) {
        const textAttachments = getTextAttachments(msg.attachments);
        if (textAttachments.length > 0) {
          const attachmentContext = formatAttachmentsAsContext(textAttachments);
          content = `${content}\n\n${attachmentContext}`;
        }
      }

      messages.push({
        role: msg.role,
        content,
      });
    }
  }

  return messages;
}

/**
 * Builds messages with vision support (multimodal content)
 */
export function buildMessagesWithVision(conversation: Conversation, mode: AIMode): CoreMessage[] {
  const messages: CoreMessage[] = [];

  for (const msg of conversation.messages) {
    if (msg.role === 'user') {
      const imageAttachments = getImageAttachments(msg.attachments);
      const textAttachments = getTextAttachments(msg.attachments);

      // Build content parts
      const parts: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = [];

      // Add text content
      let textContent = mode.preprocessUserMessage 
        ? mode.preprocessUserMessage(msg.content, conversation.context)
        : msg.content;

      // Add text attachment context
      if (textAttachments.length > 0) {
        const nonPdfTextAttachments = textAttachments.filter(att => att.mimeType !== 'application/pdf');
        if (nonPdfTextAttachments.length > 0) {
          textContent = `${textContent}\n\n${formatAttachmentsAsContext(nonPdfTextAttachments)}`;
        }
      }

      parts.push({ type: 'text', text: textContent });

      // Add images
      for (const img of imageAttachments) {
        parts.push({ type: 'image', image: img.content });
      }

      messages.push({
        role: 'user',
        content: parts,
      });
    } else if (msg.role === 'assistant') {
      messages.push({
        role: 'assistant',
        content: msg.content,
      });
    }
  }

  return messages;
}
