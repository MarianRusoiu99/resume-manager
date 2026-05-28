import type { AIProvider } from '@/lib/ai/providers';
import type { DeepPartial } from '@/lib/types';

/**
 * Chunk types for streaming
 */
export type AIStreamChunkType = 
  | 'text-delta'
  | 'tool-call'
  | 'tool-result'
  | 'finish'
  | 'error';

/**
 * Stream chunk from AI
 */
export interface AIStreamChunk {
  type: AIStreamChunkType;
  content?: string;
  toolCall?: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  };
  toolResult?: {
    toolCallId: string;
    result: unknown;
  };
  finishReason?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Parsed structured output from the AI response */
  output?: unknown;
}

/**
 * Options for the orchestrator
 */
export interface OrchestratorOptions {
  /** User ID for audit logging */
  userId: string;
  /** AI provider instance */
  provider: AIProvider;
  /** Model key to use */
  modelKey: string;
  /** Model ID for logging */
  modelId: string;
  /** Optional abort signal */
  abortSignal?: AbortSignal;
  /** Provider-specific options (e.g. reasoning config) */
  providerOptions?: Record<string, Record<string, unknown>>;
}

/**
 * Result from non-streaming generation
 */
export interface GenerationResult<T> {
  output: T;
  text: string;
  usage: NormalizedUsage;
  finishReason: string;
}

export interface NormalizedUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface StreamChunkDelta<T> {
  type: 'delta';
  partial: DeepPartial<T>;
  timestamp: number;
}

export interface StreamChunkComplete<T> {
  type: 'complete';
  final: T;
  usage: NormalizedUsage;
}

export interface StreamChunkText {
  type: 'text';
  text: string;
  timestamp: number;
}

export interface StreamChunkReasoning {
  type: 'reasoning';
  text: string;
  timestamp: number;
}

export type StreamChunk<T> =
  | StreamChunkDelta<T>
  | StreamChunkComplete<T>
  | StreamChunkText
  | StreamChunkReasoning;
