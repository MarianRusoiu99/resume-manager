/**
 * AI Tools Type Definitions
 * 
 * Proper type definitions for AI SDK Tool integration
 */

import type { Tool } from 'ai';
import type { z } from 'zod';

/**
 * Generic tool parameter schema type
 */
export type ToolParameterSchema = z.ZodType<unknown>;

/**
 * Tool with specific parameter and result types
 * This is a more specific version that works with Vercel AI SDK
 */
export type AISDKTool<
  TParameters extends Record<string, unknown> = Record<string, unknown>,
  TResult = unknown
> = Tool<TParameters, TResult>;

/**
 * Record of tools keyed by tool name
 * This replaces the use of Record<string, Tool<any, any>>
 */
export type ToolRegistry = Record<string, AISDKTool>;

/**
 * Tool builder result type
 */
export type BuildToolsResult = ToolRegistry;
