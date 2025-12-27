/**
 * Tool Registry
 *
 * Manages AI tools for function calling
 */

import type { AITool, ToolContext, ToolExecutionResult } from './types';
import { logger } from '@/lib/utils/logger';

/**
 * Registry for AI tools
 */
class ToolRegistry {
  private tools: Map<string, AITool> = new Map();

  /**
   * Registers a tool
   */
  register<TParams, TResult>(tool: AITool<TParams, TResult>): void {
    if (this.tools.has(tool.name)) {
      logger.warn(`Tool ${tool.name} is being overwritten`);
    }
    this.tools.set(tool.name, tool as AITool);
  }

  /**
   * Gets a tool by name
   */
  get(name: string): AITool | undefined {
    return this.tools.get(name);
  }

  /**
   * Gets all registered tools
   */
  getAll(): AITool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Checks if a tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Executes a tool by name
   */
  async execute<TResult>(
    name: string,
    params: unknown,
    context: ToolContext
  ): Promise<ToolExecutionResult<TResult>> {
    const tool = this.tools.get(name);
    
    if (!tool) {
      return {
        success: false,
        error: `Tool '${name}' not found`,
      };
    }

    try {
      // Validate parameters
      const validatedParams = tool.parameters.parse(params);
      
      // Execute tool
      const result = await tool.execute(validatedParams, context);
      
      return {
        success: true,
        result: result as TResult,
      };
    } catch (error) {
      logger.error(`Tool ${name} execution failed`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
      };
    }
  }

  /**
   * Clears all registered tools
   */
  clear(): void {
    this.tools.clear();
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry();

// Re-export types
export * from './types';
