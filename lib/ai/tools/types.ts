/**
 * AI Tool Types
 *
 * Defines the interface for AI function calling tools
 */

import type { z } from 'zod';
import type { Conversation } from '../chat/conversation';

/**
 * Context passed to tool execution
 */
export interface ToolContext {
  /** Current conversation */
  conversation: Conversation;
  /** User ID for permissions/logging */
  userId: string;
}

/**
 * AI Tool definition
 */
export interface AITool<TParams = any, TResult = any> {
  /** Unique tool name (used in function calling) */
  name: string;
  /** Human-readable description for AI */
  description: string;
  /** Zod schema for parameters */
  parameters: z.ZodType<TParams>;
  /**
   * Executes the tool
   * @param params - Validated parameters
   * @param context - Execution context
   */
  execute: (params: TParams, context: ToolContext) => Promise<TResult>;
}

/**
 * Creates a type-safe tool definition
 */
export function defineTool<TParams, TResult>(
  tool: AITool<TParams, TResult>
): AITool<TParams, TResult> {
  return tool;
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult<T = unknown> {
  success: boolean;
  result?: T;
  error?: string;
}

/**
 * Tool call from AI (matches Vercel AI SDK format)
 */
export interface AIToolCall {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
}

/**
 * Tool result for AI (matches Vercel AI SDK format)
 */
export interface AIToolResult {
  toolCallId: string;
  result: unknown;
}
