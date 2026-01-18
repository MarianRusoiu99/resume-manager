import { streamObject, type LanguageModel, type CoreMessage } from 'ai';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

interface StreamAIRunnerOptions<T extends z.ZodType<any>> {
  model: LanguageModel;
  prompt?: string;
  messages?: CoreMessage[];
  system?: string;
  schema: T;
  userId?: string;
  feature?: string;
}

/**
 * StreamAIRunner
 * 
 * Uses Vercel AI SDK's streamObject to provide real-time, 
 * validated JSON streaming for the resume optimizer.
 */
export class StreamAIRunner {
  static stream<T extends z.ZodType<any>>(options: StreamAIRunnerOptions<T>) {
    const { model, prompt, messages, system, schema, userId, feature } = options;

    logger.debug('Starting AI object stream', { feature, userId });

    const baseOptions = {
      model,
      schema,
      system: system ? `${system}\n\nYou MUST return a valid JSON object.` : undefined,
      onFinish({ usage, error }: { usage: any; error: any }) {
        if (error) {
          logger.error('AI streaming finished with error', { error, feature, userId });
        } else {
          logger.info('AI streaming finished successfully', { 
            feature, 
            userId, 
            usage 
          });
        }
      },
    };

    if (messages) {
      return streamObject({
        ...baseOptions,
        messages,
      } as any);
    }

    return streamObject({
      ...baseOptions,
      prompt: prompt ?? '',
    } as any);
  }
}
