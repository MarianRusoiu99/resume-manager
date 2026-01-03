/**
 * ConversationManager Tests
 * 
 * Tests for conversation state management
 */

import { describe, it, expect, afterEach } from 'vitest';
import { ConversationManager, CreateConversationOptions } from '../chat/conversation/manager';
import { conversationStore } from '../chat/conversation/store';
import type { Attachment } from '../chat/message';
import { mockResume } from './mocks';

// Track conversation IDs to clean up
const createdConversationIds: string[] = [];

function createTestConversation(options: CreateConversationOptions) {
  const conversation = ConversationManager.create(options);
  createdConversationIds.push(conversation.id);
  return conversation;
}

function cleanupConversations() {
  for (const id of createdConversationIds) {
    try {
      ConversationManager.delete(id);
    } catch {
      // ignore
    }
  }
  createdConversationIds.length = 0;
}

describe('ConversationManager', () => {
  afterEach(() => {
    cleanupConversations();
  });

  describe('create', () => {
    it('creates a new conversation with given mode', () => {
      const conversation = createTestConversation({
        mode: 'resume-generation',
      });

      expect(conversation).toBeDefined();
      expect(conversation.id).toBeDefined();
      expect(conversation.mode).toBe('resume-generation');
      expect(conversation.messages).toEqual([]);
      expect(conversation.metadata.messageCount).toBe(0);
    });

    it('creates conversation with initial context', () => {
      const conversation = createTestConversation({
        mode: 'resume-enhancement',
        initialContext: {
          userProfile: { resume: mockResume, name: 'John Doe' },
        },
      });

      expect(conversation.context.userProfile).toBeDefined();
      expect(conversation.context.userProfile?.name).toBe('John Doe');
      expect(conversation.context.userProfile?.resume).toEqual(mockResume);
    });

    it('creates conversation with attachments', () => {
      const attachment: Attachment = { 
        id: 'att-1', 
        type: 'document', 
        content: 'test content', 
        name: 'test.txt',
        mimeType: 'text/plain',
      };
      
      const conversation = createTestConversation({
        mode: 'text-enhancement',
        attachments: [attachment],
      });

      expect(conversation.context.attachments).toHaveLength(1);
      expect(conversation.context.attachments?.[0].name).toBe('test.txt');
    });

    it('stores conversation in store', () => {
      const conversation = createTestConversation({
        mode: 'cover-letter-generation',
      });

      expect(conversationStore.has(conversation.id)).toBe(true);
      expect(conversationStore.get(conversation.id)).toBe(conversation);
    });
  });

  describe('get', () => {
    it('retrieves existing conversation', () => {
      const created = createTestConversation({
        mode: 'resume-generation',
      });

      const retrieved = ConversationManager.get(created.id);

      expect(retrieved).toBe(created);
    });

    it('returns undefined for non-existent conversation', () => {
      const result = ConversationManager.get('non-existent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('getOrCreate', () => {
    it('returns existing conversation when id provided', () => {
      const existing = createTestConversation({
        mode: 'resume-generation',
      });

      const result = ConversationManager.getOrCreate(existing.id, {
        mode: 'resume-enhancement',
      });

      expect(result.id).toBe(existing.id);
      expect(result.mode).toBe('resume-generation'); // Original mode preserved
    });

    it('creates new conversation when id is undefined', () => {
      const result = ConversationManager.getOrCreate(undefined, {
        mode: 'cover-letter-generation',
      });
      createdConversationIds.push(result.id);

      expect(result).toBeDefined();
      expect(result.mode).toBe('cover-letter-generation');
    });

    it('creates new conversation when id not found', () => {
      const result = ConversationManager.getOrCreate('non-existent', {
        mode: 'text-enhancement',
      });
      createdConversationIds.push(result.id);

      expect(result).toBeDefined();
      expect(result.id).not.toBe('non-existent');
    });

    it('updates context when getting existing conversation', () => {
      const existing = createTestConversation({
        mode: 'resume-generation',
        initialContext: {
          userProfile: { resume: mockResume, name: 'John' },
        },
      });

      ConversationManager.getOrCreate(existing.id, {
        mode: 'resume-generation',
        initialContext: {
          job: { description: 'Software Engineer role', title: 'Developer' },
        },
      });

      expect(existing.context.userProfile?.name).toBe('John');
      expect(existing.context.job?.title).toBe('Developer');
    });
  });

  describe('addUserMessage', () => {
    it('adds a user message to conversation', () => {
      const conversation = createTestConversation({
        mode: 'resume-generation',
      });

      const message = ConversationManager.addUserMessage(
        conversation.id,
        'Hello, please help me with my resume'
      );

      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello, please help me with my resume');
      expect(conversation.messages).toHaveLength(1);
      expect(conversation.metadata.messageCount).toBe(1);
    });

    it('adds message with attachments', () => {
      const conversation = createTestConversation({
        mode: 'resume-enhancement',
      });

      const attachments: Attachment[] = [
        { 
          id: 'att-1', 
          type: 'document', 
          content: 'base64...', 
          name: 'resume.pdf',
          mimeType: 'application/pdf',
        },
      ];

      const message = ConversationManager.addUserMessage(
        conversation.id,
        'Please review this',
        attachments
      );

      expect(message.attachments).toEqual(attachments);
      expect(conversation.context.attachments).toContainEqual(attachments[0]);
    });

    it('throws for non-existent conversation', () => {
      expect(() => {
        ConversationManager.addUserMessage('non-existent', 'test');
      }).toThrow('Conversation non-existent not found');
    });
  });

  describe('addAssistantMessage', () => {
    it('adds an assistant message to conversation', () => {
      const conversation = createTestConversation({
        mode: 'resume-generation',
      });

      const message = ConversationManager.addAssistantMessage(
        conversation.id,
        'Here is your optimized resume'
      );

      expect(message.role).toBe('assistant');
      expect(message.content).toBe('Here is your optimized resume');
      expect(conversation.messages).toHaveLength(1);
    });

    it('adds message with output', () => {
      const conversation = createTestConversation({
        mode: 'resume-generation',
      });

      const output = { resume: { basics: { name: 'John' } } };

      ConversationManager.addAssistantMessage(
        conversation.id,
        'Generated resume',
        output
      );

      expect(conversation.output).toEqual(output);
    });

    it('throws for non-existent conversation', () => {
      expect(() => {
        ConversationManager.addAssistantMessage('non-existent', 'test');
      }).toThrow('Conversation non-existent not found');
    });
  });

  describe('setOutput', () => {
    it('sets conversation output', () => {
      const conversation = createTestConversation({
        mode: 'resume-generation',
      });

      const output = { optimizedResume: { basics: {} } };
      ConversationManager.setOutput(conversation.id, output);

      expect(conversation.output).toEqual(output);
    });

    it('updates updatedAt timestamp', () => {
      const conversation = createTestConversation({
        mode: 'resume-generation',
      });
      const originalUpdatedAt = conversation.metadata.updatedAt;

      ConversationManager.setOutput(conversation.id, { data: 'test' });

      expect(conversation.metadata.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });

    it('throws for non-existent conversation', () => {
      expect(() => {
        ConversationManager.setOutput('non-existent', {});
      }).toThrow('Conversation non-existent not found');
    });
  });

  describe('updateContext', () => {
    it('updates conversation context', () => {
      const conversation = createTestConversation({
        mode: 'resume-generation',
      });

      ConversationManager.updateContext(conversation.id, {
        userProfile: { resume: mockResume, name: 'Jane' },
      });

      expect(conversation.context.userProfile?.name).toBe('Jane');
    });

    it('merges with existing context', () => {
      const conversation = createTestConversation({
        mode: 'resume-generation',
        initialContext: {
          userProfile: { resume: mockResume, name: 'John' },
        },
      });

      ConversationManager.updateContext(conversation.id, {
        job: { description: 'Engineer role', title: 'Engineer' },
      });

      expect(conversation.context.userProfile?.name).toBe('John');
      expect(conversation.context.job?.title).toBe('Engineer');
    });

    it('throws for non-existent conversation', () => {
      expect(() => {
        ConversationManager.updateContext('non-existent', {});
      }).toThrow('Conversation non-existent not found');
    });
  });

  describe('getMessages', () => {
    it('returns all messages from conversation', () => {
      const conversation = createTestConversation({
        mode: 'resume-generation',
      });

      ConversationManager.addUserMessage(conversation.id, 'First');
      ConversationManager.addAssistantMessage(conversation.id, 'Response');
      ConversationManager.addUserMessage(conversation.id, 'Second');

      const messages = ConversationManager.getMessages(conversation.id);

      expect(messages).toHaveLength(3);
      expect(messages[0].content).toBe('First');
      expect(messages[1].content).toBe('Response');
      expect(messages[2].content).toBe('Second');
    });

    it('returns empty array for non-existent conversation', () => {
      const messages = ConversationManager.getMessages('non-existent');

      expect(messages).toEqual([]);
    });
  });

  describe('getOutput', () => {
    it('returns conversation output', () => {
      const conversation = createTestConversation({
        mode: 'resume-generation',
      });

      const output = { resume: { name: 'Test' } };
      ConversationManager.setOutput(conversation.id, output);

      const result = ConversationManager.getOutput(conversation.id);

      expect(result).toEqual(output);
    });

    it('returns undefined for conversation without output', () => {
      const conversation = createTestConversation({
        mode: 'resume-generation',
      });

      const result = ConversationManager.getOutput(conversation.id);

      expect(result).toBeUndefined();
    });

    it('returns undefined for non-existent conversation', () => {
      const result = ConversationManager.getOutput('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('clearMessages', () => {
    it('clears all messages from conversation', () => {
      const conversation = createTestConversation({
        mode: 'resume-generation',
      });

      ConversationManager.addUserMessage(conversation.id, 'Message 1');
      ConversationManager.addAssistantMessage(conversation.id, 'Response');

      ConversationManager.clearMessages(conversation.id);

      expect(conversation.messages).toHaveLength(0);
      expect(conversation.metadata.messageCount).toBe(0);
    });

    it('clears output when clearing messages', () => {
      const conversation = createTestConversation({
        mode: 'resume-generation',
      });

      ConversationManager.setOutput(conversation.id, { data: 'test' });
      ConversationManager.clearMessages(conversation.id);

      expect(conversation.output).toBeUndefined();
    });

    it('preserves context when clearing messages', () => {
      const conversation = createTestConversation({
        mode: 'resume-generation',
        initialContext: {
          userProfile: { resume: mockResume, name: 'Keep Me' },
        },
      });

      ConversationManager.clearMessages(conversation.id);

      expect(conversation.context.userProfile?.name).toBe('Keep Me');
    });
  });

  describe('delete', () => {
    it('deletes conversation from store', () => {
      const conversation = createTestConversation({
        mode: 'resume-generation',
      });

      const result = ConversationManager.delete(conversation.id);

      expect(result).toBe(true);
      expect(conversationStore.has(conversation.id)).toBe(false);
    });

    it('returns false for non-existent conversation', () => {
      const result = ConversationManager.delete('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('returns true for existing conversation', () => {
      const conversation = createTestConversation({
        mode: 'resume-generation',
      });

      expect(ConversationManager.exists(conversation.id)).toBe(true);
    });

    it('returns false for non-existent conversation', () => {
      expect(ConversationManager.exists('non-existent')).toBe(false);
    });
  });

  describe('undo', () => {
    it('undoes the last message change', () => {
      const conversation = createTestConversation({
        mode: 'resume-generation',
      });

      ConversationManager.addUserMessage(conversation.id, 'First message');
      ConversationManager.addUserMessage(conversation.id, 'Second message');

      const undone = ConversationManager.undo(conversation.id);

      expect(undone).toBe(true);
      expect(conversation.messages).toHaveLength(1);
      expect(conversation.messages[0].content).toBe('First message');
    });

    it('returns false when no snapshots available', () => {
      const conversation = createTestConversation({
        mode: 'resume-generation',
      });

      const undone = ConversationManager.undo(conversation.id);

      expect(undone).toBe(false);
    });
  });
});
