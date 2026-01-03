/**
 * Message Utilities Tests
 * 
 * Tests for AI chat message creation and formatting
 */

import { describe, it, expect } from 'vitest';
import {
  createUserMessage,
  createAssistantMessage,
  createSystemMessage,
  createToolMessage,
  formatAttachmentsAsContext,
  hasImageAttachments,
  getImageAttachments,
  getTextAttachments,
  type Attachment,
} from '../chat/message';

describe('Message Creation', () => {
  describe('createUserMessage', () => {
    it('creates a user message with content', () => {
      const message = createUserMessage('Hello, world!');
      
      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello, world!');
      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeInstanceOf(Date);
      expect(message.attachments).toBeUndefined();
    });

    it('creates a user message with attachments', () => {
      const attachments: Attachment[] = [
        { id: '1', type: 'document', name: 'file.pdf', content: 'content', mimeType: 'application/pdf' },
      ];
      
      const message = createUserMessage('Check this file', attachments);
      
      expect(message.attachments).toEqual(attachments);
      expect(message.attachments).toHaveLength(1);
    });
  });

  describe('createAssistantMessage', () => {
    it('creates an assistant message with content', () => {
      const message = createAssistantMessage('Here is my response');
      
      expect(message.role).toBe('assistant');
      expect(message.content).toBe('Here is my response');
      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeInstanceOf(Date);
    });

    it('creates an assistant message with tool calls', () => {
      const toolCalls = [
        { id: 'call-1', name: 'search', arguments: { query: 'test' } },
      ];
      
      const message = createAssistantMessage('Searching...', toolCalls);
      
      expect(message.toolCalls).toEqual(toolCalls);
    });
  });

  describe('createSystemMessage', () => {
    it('creates a system message', () => {
      const message = createSystemMessage('You are a helpful assistant');
      
      expect(message.role).toBe('system');
      expect(message.content).toBe('You are a helpful assistant');
      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('createToolMessage', () => {
    it('creates a tool result message', () => {
      const toolResults = [
        { toolCallId: 'call-1', result: { data: 'result' } },
      ];
      
      const message = createToolMessage(toolResults);
      
      expect(message.role).toBe('tool');
      expect(message.content).toBe('');
      expect(message.toolResults).toEqual(toolResults);
    });

    it('handles error results', () => {
      const toolResults = [
        { toolCallId: 'call-1', result: 'Error occurred', isError: true },
      ];
      
      const message = createToolMessage(toolResults);
      
      expect(message.toolResults?.[0].isError).toBe(true);
    });
  });
});

describe('Attachment Utilities', () => {
  const documentAttachment: Attachment = {
    id: '1',
    type: 'document',
    name: 'file.pdf',
    content: 'PDF content here',
    mimeType: 'application/pdf',
  };

  const imageAttachment: Attachment = {
    id: '2',
    type: 'image',
    name: 'photo.png',
    content: 'base64-image-data',
    mimeType: 'image/png',
  };

  const resumeAttachment: Attachment = {
    id: '3',
    type: 'resume',
    name: 'resume.json',
    content: '{"basics": {"name": "John"}}',
    mimeType: 'application/json',
  };

  describe('formatAttachmentsAsContext', () => {
    it('formats document attachments with content', () => {
      const result = formatAttachmentsAsContext([documentAttachment]);
      
      expect(result).toContain('DOCUMENT:');
      expect(result).toContain('file.pdf');
      expect(result).toContain('PDF content here');
    });

    it('formats image attachments without base64 content', () => {
      const result = formatAttachmentsAsContext([imageAttachment]);
      
      expect(result).toContain('IMAGE:');
      expect(result).toContain('photo.png');
      expect(result).toContain('[Image attached');
      expect(result).not.toContain('base64-image-data');
    });

    it('formats multiple attachments', () => {
      const result = formatAttachmentsAsContext([documentAttachment, imageAttachment]);
      
      expect(result).toContain('DOCUMENT:');
      expect(result).toContain('IMAGE:');
    });

    it('returns empty string for no attachments', () => {
      const result = formatAttachmentsAsContext([]);
      
      expect(result).toBe('');
    });
  });

  describe('hasImageAttachments', () => {
    it('returns true when image attachments present', () => {
      expect(hasImageAttachments([imageAttachment])).toBe(true);
      expect(hasImageAttachments([documentAttachment, imageAttachment])).toBe(true);
    });

    it('returns false when no image attachments', () => {
      expect(hasImageAttachments([documentAttachment])).toBe(false);
      expect(hasImageAttachments([resumeAttachment])).toBe(false);
    });

    it('returns false for undefined or empty array', () => {
      expect(hasImageAttachments(undefined)).toBe(false);
      expect(hasImageAttachments([])).toBe(false);
    });
  });

  describe('getImageAttachments', () => {
    it('filters only image attachments', () => {
      const attachments = [documentAttachment, imageAttachment, resumeAttachment];
      const result = getImageAttachments(attachments);
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('image');
    });

    it('returns empty array when no images', () => {
      const result = getImageAttachments([documentAttachment]);
      
      expect(result).toEqual([]);
    });

    it('returns empty array for undefined', () => {
      const result = getImageAttachments(undefined);
      
      expect(result).toEqual([]);
    });
  });

  describe('getTextAttachments', () => {
    it('filters out image attachments', () => {
      const attachments = [documentAttachment, imageAttachment, resumeAttachment];
      const result = getTextAttachments(attachments);
      
      expect(result).toHaveLength(2);
      expect(result.every(a => a.type !== 'image')).toBe(true);
    });

    it('returns all attachments when no images', () => {
      const attachments = [documentAttachment, resumeAttachment];
      const result = getTextAttachments(attachments);
      
      expect(result).toHaveLength(2);
    });

    it('returns empty array for undefined', () => {
      const result = getTextAttachments(undefined);
      
      expect(result).toEqual([]);
    });
  });
});
