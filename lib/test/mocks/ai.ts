import { vi } from 'vitest';

// Mock AI SDK stream response
export function createMockAIStream(content: string) {
  return {
    textStream: (async function* () {
      yield content;
    })(),
    text: Promise.resolve(content),
  };
}

// Mock AI SDK response
export function createMockAIResponse(content: string) {
  return {
    text: content,
    usage: {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    },
  };
}

// Mock generateText function
export const mockGenerateText = vi.fn(async ({ prompt }: { prompt: string }) => {
  return createMockAIResponse('Generated response for: ' + prompt);
});

// Mock streamText function
export const mockStreamText = vi.fn(async ({ prompt }: { prompt: string }) => {
  return createMockAIStream('Streamed response for: ' + prompt);
});

// Reset all AI mocks
export function resetAIMocks() {
  mockGenerateText.mockClear();
  mockStreamText.mockClear();
}
