/**
 * Mock for AI SDK
 * 
 * Provides mock responses for AI SDK stream text and generate text functions
 */

import { vi } from 'vitest';

/**
 * Mock AI stream response
 */
export function createMockAIStream(content: string) {
  return {
    textStream: (async function* () {
      // Split content into chunks to simulate streaming
      const chunks = content.match(/.{1,10}/g) || [content];
      for (const chunk of chunks) {
        yield chunk;
      }
    })(),
    text: Promise.resolve(content),
    usage: Promise.resolve({
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
    }),
  };
}

/**
 * Mock AI generate text response
 */
export function createMockAIResponse(content: string) {
  return {
    text: content,
    usage: {
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
    },
    finishReason: 'stop' as const,
  };
}

/**
 * Mock streamText function
 */
export function mockStreamText(content: string) {
  return vi.fn().mockResolvedValue(createMockAIStream(content));
}

/**
 * Mock generateText function
 */
export function mockGenerateText(content: string) {
  return vi.fn().mockResolvedValue(createMockAIResponse(content));
}

/**
 * Create a mock AI provider configuration
 */
export function createMockAIProvider(provider: 'openai' | 'anthropic' | 'google' = 'openai') {
  return {
    provider,
    apiKey: 'test-api-key',
    model: provider === 'openai' ? 'gpt-4' : provider === 'anthropic' ? 'claude-3-opus' : 'gemini-pro',
  };
}
