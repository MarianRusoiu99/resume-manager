import { generateText, streamText, type LanguageModel, type Tool } from 'ai';
import { logger } from '@/lib/utils/logger';

export interface CoreAgentOptions {
  model: LanguageModel;
  system: string;
  prompt: string;
  tools: Record<string, Tool>;
  maxSteps?: number;
  abortSignal?: AbortSignal;
  onStepFinish?: (step: unknown) => void;
}

export class CoreAgent {
  /**
   * Executes a task autonomously using the provided tools.
   */
  static async execute(options: CoreAgentOptions) {
    const { model, system, prompt, tools, maxSteps = 5, abortSignal, onStepFinish } = options;

    logger.info('Starting CoreAgent execution', { maxSteps });

    const result = await generateText({
      model,
      system,
      prompt,
      tools,
      maxSteps,
      abortSignal,
      onStepFinish,
    } as Parameters<typeof generateText>[0]);

    return result;
  }

  /**
   * Executes a task and streams the result.
   */
  static stream(options: CoreAgentOptions) {
    const { model, system, prompt, tools, maxSteps = 5, abortSignal, onStepFinish } = options;

    logger.info('Starting CoreAgent stream', { maxSteps });

    return streamText({
      model,
      system,
      prompt,
      tools,
      maxSteps,
      abortSignal,
      onStepFinish,
    } as Parameters<typeof streamText>[0]);
  }
}
