/**
 * ValidatedAIRunner Tests
 * 
 * Tests for schema validation, retry logic, and JSON parsing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { ValidatedAIRunner } from '../core/validated-runner';
import { createMockLanguageModel, TEST_USER } from './mocks';

// Mock the audit log service to avoid database calls
vi.mock('@/lib/services', () => ({
  auditLogService: {
    logAsync: vi.fn(),
  },
}));

// Mock the logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ValidatedAIRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('run - basic validation', () => {
    it('parses and validates JSON response', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const mockModel = createMockLanguageModel({
        response: JSON.stringify({ name: 'John', age: 30 }),
      });

      const result = await ValidatedAIRunner.run({
        model: mockModel,
        prompt: 'Generate a person',
        schema,
      });

      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('handles nested object schemas', async () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string().email(),
        }),
        metadata: z.object({
          createdAt: z.string(),
        }),
      });

      const mockResponse = {
        user: { name: 'Jane', email: 'jane@example.com' },
        metadata: { createdAt: '2024-01-01' },
      };

      const mockModel = createMockLanguageModel({
        response: JSON.stringify(mockResponse),
      });

      const result = await ValidatedAIRunner.run({
        model: mockModel,
        prompt: 'Generate user data',
        schema,
      });

      expect(result).toEqual(mockResponse);
    });

    it('handles array schemas', async () => {
      const schema = z.array(z.object({
        id: z.number(),
        title: z.string(),
      }));

      const mockResponse = [
        { id: 1, title: 'First' },
        { id: 2, title: 'Second' },
      ];

      const mockModel = createMockLanguageModel({
        response: JSON.stringify(mockResponse),
      });

      const result = await ValidatedAIRunner.run({
        model: mockModel,
        prompt: 'Generate items',
        schema,
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('run - string schema handling', () => {
    it('returns raw text for string schema when not JSON', async () => {
      const schema = z.string();

      const mockModel = createMockLanguageModel({
        response: 'This is plain text response',
      });

      const result = await ValidatedAIRunner.run({
        model: mockModel,
        prompt: 'Generate text',
        schema,
      });

      expect(result).toBe('This is plain text response');
    });
  });

  describe('run - JSON extraction', () => {
    it('extracts JSON from markdown code blocks', async () => {
      const schema = z.object({ value: z.string() });

      const mockModel = createMockLanguageModel({
        response: '```json\n{"value": "extracted"}\n```',
      });

      const result = await ValidatedAIRunner.run({
        model: mockModel,
        prompt: 'Generate JSON',
        schema,
      });

      expect(result).toEqual({ value: 'extracted' });
    });

    it('extracts JSON object from mixed content', async () => {
      const schema = z.object({ data: z.string() });

      const mockModel = createMockLanguageModel({
        response: 'Here is the result: {"data": "value"} end of response',
      });

      const result = await ValidatedAIRunner.run({
        model: mockModel,
        prompt: 'Generate JSON',
        schema,
      });

      expect(result).toEqual({ data: 'value' });
    });
  });

  describe('run - retry logic', () => {
    it('throws after max retries exceeded with invalid response', async () => {
      const schema = z.object({ required: z.string() });

      const mockModel = createMockLanguageModel({
        response: '{"wrong": "structure"}',
      });

      await expect(
        ValidatedAIRunner.run({
          model: mockModel,
          prompt: 'Generate data',
          schema,
          maxRetries: 1,
        })
      ).rejects.toThrow(/AI failed to generate valid output/);
    });
  });

  describe('run - error handling', () => {
    it('handles model errors gracefully', async () => {
      const schema = z.object({ data: z.string() });

      const mockModel = createMockLanguageModel({
        shouldError: true,
        errorMessage: 'Model unavailable',
      });

      await expect(
        ValidatedAIRunner.run({
          model: mockModel,
          prompt: 'Generate data',
          schema,
          maxRetries: 0,
        })
      ).rejects.toThrow(/AI failed to generate valid output/);
    });
  });

  describe('run - with userId for audit logging', () => {
    it('logs usage when userId is provided', async () => {
      const { auditLogService } = await import('@/lib/services');
      
      const schema = z.object({ message: z.string() });
      const mockModel = createMockLanguageModel({
        response: JSON.stringify({ message: 'hello' }),
      });

      await ValidatedAIRunner.run({
        model: mockModel,
        prompt: 'Test prompt',
        schema,
        userId: TEST_USER.id,
        feature: 'test-feature',
      });

      expect(auditLogService.logAsync).toHaveBeenCalled();
    });
  });

  describe('run - with messages instead of prompt', () => {
    it('accepts messages array', async () => {
      const schema = z.object({ reply: z.string() });

      const mockModel = createMockLanguageModel({
        response: JSON.stringify({ reply: 'Hello!' }),
      });

      const result = await ValidatedAIRunner.run({
        model: mockModel,
        messages: [
          { role: 'user', content: 'Hi there' },
        ],
        schema,
      });

      expect(result).toEqual({ reply: 'Hello!' });
    });
  });

  describe('run - with system prompt', () => {
    it('includes system prompt in generation', async () => {
      const schema = z.object({ response: z.string() });

      const mockModel = createMockLanguageModel({
        response: JSON.stringify({ response: 'Formal greeting' }),
      });

      const result = await ValidatedAIRunner.run({
        model: mockModel,
        prompt: 'Say hello',
        system: 'You are a formal assistant',
        schema,
      });

      expect(result).toEqual({ response: 'Formal greeting' });
    });
  });
});

describe('ValidatedAIRunner.stream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('streams text response', async () => {
    const mockModel = createMockLanguageModel({
      response: 'Streamed content',
    });

    const result = await ValidatedAIRunner.stream({
      model: mockModel,
      prompt: 'Stream text',
    });

    expect(result).toBeDefined();
  });

  it('streams with messages array', async () => {
    const mockModel = createMockLanguageModel({
      response: 'Streamed reply',
    });

    const result = await ValidatedAIRunner.stream({
      model: mockModel,
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(result).toBeDefined();
  });
});
