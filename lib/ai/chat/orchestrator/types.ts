import type { ConversationMode } from '../conversation';
import type { AIProvider } from '../../providers';

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
}

/**
 * Result from non-streaming generation
 */
export interface GenerationResult<T> {
  output: T;
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

export interface NormalizedUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
