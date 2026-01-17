
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConversation } from '../use-conversation/index';
import { UseConversationOptions } from '../use-conversation/types';

// Helper to create a mock ReadableStream for fetch response
function createMockStream(chunks: string[]) {
  return new ReadableStream({
    start(controller) {
      chunks.forEach(chunk => {
        controller.enqueue(new TextEncoder().encode(chunk));
      });
      controller.close();
    }
  });
}

describe('useConversation Hook', () => {
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useConversation({ mode: 'resume-generation' }));

    expect(result.current.state).toEqual({
      id: null,
      mode: 'resume-generation',
      messages: [],
      context: {},
      output: null,
      isLoading: false,
      isStreaming: false,
      error: null,
    });
  });

  it('should handle streaming response', async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useConversation<{ text: string }>({ 
      mode: 'resume-generation',
      onComplete 
    }));

    const mockStreamChunks = [
      `data: {"type":"delta","partial":{"text":"Hello"}}\n\n`,
      `data: {"type":"delta","partial":{"text":" World"}}\n\n`,
      `data: {"type":"complete","final":{"text":"Hello World"}}\n\n`
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({
        'Content-Type': 'text/event-stream',
        'X-Conversation-Id': 'conv-123'
      }),
      body: createMockStream(mockStreamChunks)
    });

    await act(async () => {
      await result.current.sendMessage({
        message: 'Hi',
        stream: true
      });
    });

    // Verify final state
    expect(result.current.state.output).toEqual({ text: 'Hello World' });
    expect(result.current.state.messages).toHaveLength(2); // User + Assistant
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.id).toBe('conv-123');
    expect(onComplete).toHaveBeenCalledWith({ text: 'Hello World' });
  });

  it('should handle API errors', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useConversation({ 
      mode: 'resume-generation',
      onError 
    }));

    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Server Error' })
    });

    await act(async () => {
      await result.current.sendMessage({ message: 'Hi' });
    });

    expect(result.current.state.error).toContain('Server Error');
    expect(onError).toHaveBeenCalled();
  });

  it('should allow aborting request', async () => {
    const { result } = renderHook(() => useConversation({ mode: 'resume-generation' }));
    
    // Create a stream that never closes to simulate long request
    const delayedStream = new ReadableStream({
        start() {} // Never closes
    });

    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'Content-Type': 'text/event-stream' }),
      body: delayedStream
    });

    // Start request but don't await it yet
    const promise = act(async () => {
        result.current.sendMessage({ message: 'Hi', stream: true }).catch(() => {});
    });

    // Abort immediately
    await act(async () => {
        result.current.abort();
    });
    
    // Should result in reset loading state
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.isStreaming).toBe(false);
  });
});
