import { type ConversationMessage } from "./types";

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Handle streaming response logic
 */
export async function processStreamResponse(
  body: ReadableStream<Uint8Array>,
  onUpdate: (content: string) => void
): Promise<{ fullContent: string; output: unknown }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  let output: unknown = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);

          if (parsed.type === 'text-delta' && parsed.content) {
            fullContent += parsed.content;
            onUpdate(fullContent);
          } else if (parsed.type === 'error') {
            throw new Error(parsed.error);
          }
        } catch (parseError) {
          // Ignore parse errors for malformed chunks
        }
      }
    }

    // Try to parse structured output from content
    try {
      if (fullContent.includes('{')) {
        const jsonMatch = fullContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, fullContent];
        output = JSON.parse(jsonMatch[1] || fullContent);
      }
    } catch {
      // Not JSON, that's okay
    }

    return { fullContent, output };
  } finally {
    reader.releaseLock();
  }
}
