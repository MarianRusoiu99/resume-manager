/**
 * Base Agent Class
 * 
 * Modern base class using LangChain's structured output patterns.
 * Follows SOLID principles:
 * - Single Responsibility: Each agent handles one specific task
 * - Open/Closed: Extensible through schema definition
 * - Liskov Substitution: Consistent interface for all agents
 * - Interface Segregation: Clean, minimal interface
 * - Dependency Inversion: Depends on LangChain abstractions
 */

import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import type { BaseMessage } from '@langchain/core/messages';
import { retryWithBackoff, AI_RETRY_CONFIG } from '@/lib/utils/retry';
import { getModelConfig, type AgentType } from '../config/models';
import { 
  createSystemMessage, 
  createHumanMessage,
  createStructuredParser,
} from '../utils';
import type { ZodType } from 'zod';

/**
 * Base configuration for all agents
 */
export interface BaseAgentConfig {
  apiKey: string;
  agentType: AgentType;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  enableLogging?: boolean;
}

/**
 * Standard agent execution result
 */
export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  tokensUsed: number;
  duration: number;
  metadata?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    model?: string;
  };
}

/**
 * Agent metadata for tracking
 */
export interface AgentMetadata {
  agentType: AgentType;
  model: string;
  temperature: number;
  timestamp: Date;
}

/**
 * Base class for AI agents with structured output
 */
export abstract class BaseAgent<TInput = unknown, TOutput = unknown> {
  protected readonly config: Required<BaseAgentConfig>;
  protected readonly llm: ChatOpenAI;
  protected readonly logger: (...args: unknown[]) => void;
  protected readonly outputSchema: ZodType<TOutput>;
  protected readonly parser: ReturnType<typeof createStructuredParser<TOutput>>;

  constructor(config: BaseAgentConfig, outputSchema: ZodType<TOutput>) {
    // Merge with model configuration
    const modelConfig = getModelConfig(config.agentType);
    
    this.config = {
      ...config,
      model: config.model || modelConfig.name,
      temperature: config.temperature ?? modelConfig.temperature,
      maxTokens: config.maxTokens || modelConfig.maxTokens,
      enableLogging: config.enableLogging ?? true,
    };

    this.outputSchema = outputSchema;
    this.parser = createStructuredParser(outputSchema);

    // Initialize LLM with structured output support
    this.llm = new ChatOpenAI({
      openAIApiKey: this.config.apiKey,
      modelName: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });

    // Setup logger
    this.logger = this.config.enableLogging 
      ? (...args) => console.log(`[${this.config.agentType}]`, ...args)
      : () => {};
  }

  /**
   * Build the prompt for this agent
   * 
   * @param input - Agent-specific input data
   * @returns Array of messages to send to the LLM
   */
  protected abstract buildPrompt(input: TInput): BaseMessage[] | Promise<BaseMessage[]>;

  /**
   * Get format instructions to include in system prompt
   * This tells the LLM how to structure its response
   */
  protected getFormatInstructions(): string {
    return this.parser.getFormatInstructions();
  }

  /**
   * Execute the agent with retry logic and structured output
   * 
   * Uses .withStructuredOutput() with includeRaw: true to get both:
   * - Parsed, validated output (via Zod schema)
   * - Raw AIMessage with actual token usage metadata
   * 
   * This follows LangChain best practices for accurate token tracking
   * instead of estimations.
   * 
   * @param input - Agent-specific input data
   * @returns Agent execution result with typed output and metadata
   */
  async execute(input: TInput): Promise<AgentResult<TOutput>> {
    const startTime = Date.now();
    this.logger('Starting execution...');

    try {
      // Build prompt
      this.logger('Building prompt...');
      const messages = await this.buildPrompt(input);

      // Use withStructuredOutput with includeRaw: true to get both parsed output AND metadata
      // This is the recommended approach per LangChain docs for accessing token usage
      const structuredLLM = this.llm.withStructuredOutput(this.outputSchema, {
        includeRaw: true,
      });

      // Execute with retry logic
      this.logger('Calling LLM with structured output...');
      const result = await retryWithBackoff(
        async () => {
          return await structuredLLM.invoke(messages);
        },
        {
          ...AI_RETRY_CONFIG,
          onRetry: (error, attempt, delay) => {
            this.logger(`Retry attempt ${attempt} after ${delay}ms due to: ${error.message}`);
          },
        }
      );

      // Extract parsed output and raw message
      const { parsed, raw } = result as { parsed: TOutput; raw: { usage_metadata?: { input_tokens?: number; output_tokens?: number; total_tokens?: number } } };
      
      const duration = Date.now() - startTime;
      
      // Use actual token usage from API response if available (much more accurate)
      const usageMetadata = raw.usage_metadata;
      const tokensUsed = usageMetadata?.total_tokens ?? this.estimateTokens(JSON.stringify(parsed));
      
      this.logger(`Execution completed in ${duration}ms, ${tokensUsed} tokens`);
      if (usageMetadata) {
        this.logger(`  - Prompt tokens: ${usageMetadata.input_tokens}`);
        this.logger(`  - Completion tokens: ${usageMetadata.output_tokens}`);
      }

      return {
        success: true,
        data: parsed,
        tokensUsed,
        duration,
        metadata: usageMetadata ? {
          promptTokens: usageMetadata.input_tokens,
          completionTokens: usageMetadata.output_tokens,
          totalTokens: usageMetadata.total_tokens,
          model: this.config.model,
        } : undefined,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger(`Execution failed after ${duration}ms:`, errorMessage);

      return {
        success: false,
        error: errorMessage,
        tokensUsed: 0,
        duration,
      };
    }
  }

  /**
   * Execute with custom chain (for more complex workflows)
   * 
   * @param input - Agent input
   * @param chain - Custom runnable chain
   * @returns Agent execution result
   */
  protected async executeWithChain(
    input: TInput,
    chain: RunnableSequence
  ): Promise<AgentResult<TOutput>> {
    const startTime = Date.now();
    this.logger('Executing custom chain...');

    try {
      const rawResponse = await retryWithBackoff(
        () => chain.invoke({ input }),
        {
          ...AI_RETRY_CONFIG,
          onRetry: (error, attempt, delay) => {
            this.logger(`Retry attempt ${attempt} after ${delay}ms due to: ${error.message}`);
          },
        }
      );

      // Parse the response using structured parser
      const output = await this.parser.parse(rawResponse as string);

      const duration = Date.now() - startTime;
      const tokensUsed = this.estimateTokens(rawResponse as string);

      this.logger(`Chain execution completed in ${duration}ms`);

      return {
        success: true,
        data: output,
        tokensUsed,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger(`Chain execution failed after ${duration}ms:`, errorMessage);

      return {
        success: false,
        error: errorMessage,
        tokensUsed: 0,
        duration,
      };
    }
  }

  /**
   * Create a template-based chain with structured output
   * 
   * @param template - Prompt template string with {variables}
   * @returns Runnable chain with parser
   */
  protected createTemplateChain(template: string): RunnableSequence {
    const prompt = PromptTemplate.fromTemplate(template);
    
    return RunnableSequence.from([
      prompt,
      this.llm,
      this.parser,
    ]);
  }

  /**
   * Estimate token count from text
   * 
   * Uses rough approximation: 1 token ≈ 4 characters
   * For production, use tiktoken library for accurate counting
   * 
   * @param text - Text to estimate tokens for
   * @returns Approximate token count
   */
  protected estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Get agent metadata for tracking
   */
  getMetadata(): AgentMetadata {
    return {
      agentType: this.config.agentType,
      model: this.config.model,
      temperature: this.config.temperature,
      timestamp: new Date(),
    };
  }

  /**
   * Log execution metrics
   * 
   * @param result - Agent execution result
   */
  protected logMetrics(result: AgentResult<TOutput>): void {
    if (!this.config.enableLogging) return;

    console.log(`[${this.config.agentType}] Metrics:`, {
      success: result.success,
      duration: `${result.duration}ms`,
      tokensUsed: result.tokensUsed,
      hasData: !!result.data,
      error: result.error || null,
    });
  }
}

/**
 * Helper function to create system + user message pair with format instructions
 * 
 * @param systemPrompt - Base system prompt
 * @param userPrompt - User message
 * @param formatInstructions - Optional format instructions from parser
 * @returns Array of messages
 */
export function createAgentMessages(
  systemPrompt: string,
  userPrompt: string,
  formatInstructions?: string
): BaseMessage[] {
  const systemMessage = formatInstructions
    ? `${systemPrompt}\n\n${formatInstructions}`
    : systemPrompt;

  return [
    createSystemMessage(systemMessage),
    createHumanMessage(userPrompt),
  ];
}

/**
 * Helper to batch multiple agent executions in parallel
 * 
 * @param agents - Array of agents to execute
 * @param inputs - Corresponding inputs for each agent
 * @returns Array of results
 */
export async function executeAgentBatch<T>(
  agents: BaseAgent<unknown, T>[],
  inputs: unknown[]
): Promise<AgentResult<T>[]> {
  if (agents.length !== inputs.length) {
    throw new Error('Number of agents must match number of inputs');
  }

  return Promise.all(
    agents.map((agent, i) => agent.execute(inputs[i]))
  );
}

/**
 * Helper to execute agents sequentially with state passing
 * 
 * @param agents - Array of agents to execute in sequence
 * @param initialInput - Initial input for first agent
 * @param transform - Function to transform output to next input
 * @returns Final result
 */
export async function executeAgentSequence<TIn, TOut>(
  agents: BaseAgent<unknown, unknown>[],
  initialInput: TIn,
  transform: (output: unknown, index: number) => unknown
): Promise<AgentResult<TOut>> {
  let currentInput: unknown = initialInput;
  let totalTokens = 0;
  let totalDuration = 0;

  for (let i = 0; i < agents.length; i++) {
    const result = await agents[i].execute(currentInput);
    
    if (!result.success) {
      return result as AgentResult<TOut>;
    }

    totalTokens += result.tokensUsed;
    totalDuration += result.duration;
    
    // Transform output for next agent
    currentInput = transform(result.data, i);
  }

  return {
    success: true,
    data: currentInput as TOut,
    tokensUsed: totalTokens,
    duration: totalDuration,
  };
}
