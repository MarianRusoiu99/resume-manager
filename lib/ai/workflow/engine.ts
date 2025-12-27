/**
 * Workflow Engine
 * 
 * Executes configurable AI workflows with progress tracking
 */

import type {
  WorkflowConfig,
  WorkflowContext,
  WorkflowResult,
  ProgressCallback,
} from './types';
import type { Resume } from '@/lib/validations/jsonresume';
import type { AIProvider } from '@/lib/ai/providers';
import { logger } from '@/lib/utils/logger';

export interface ExecuteWorkflowInput {
  /** Workflow configuration */
  config: WorkflowConfig;
  /** AI provider instance */
  provider: AIProvider;
  /** Provider-native model key to use */
  modelKey: string;
  /** Job description text */
  jobDescription: string;
  /** User's resume (source of truth) */
  userResume: Resume;
  /** Optional user ID */
  userId?: string;
  /** Progress callback for streaming */
  onProgress?: ProgressCallback;
}

/**
 * Execute a workflow with the given configuration
 */
export async function executeWorkflow(
  input: ExecuteWorkflowInput
): Promise<WorkflowResult> {
  const startTime = Date.now();
  const executedSteps: string[] = [];
  const skippedSteps: string[] = [];

  // Initialize context
  const context: WorkflowContext = {
    provider: input.provider,
    modelKey: input.modelKey,
    jobDescription: input.jobDescription,
    userResume: input.userResume,
    userId: input.userId,
    onProgress: input.onProgress,
    results: {},
  };

  const { config, onProgress } = input;

  try {
    logger.info('Starting workflow', { workflow: config.name });
    onProgress?.('init', `Starting ${config.name}...`, 0);

    // Execute each step in order
    for (const step of config.steps) {
      // Check if step should be skipped
      if (step.shouldSkip?.(context)) {
        logger.debug('Skipping workflow step', { workflow: config.name, stepId: step.id, stepName: step.name });
        skippedSteps.push(step.id);
        continue;
      }

      logger.info('Executing workflow step', { workflow: config.name, stepId: step.id, stepName: step.name });
      onProgress?.(step.id, step.description, step.progressStart);

      try {
        // Execute the step
        const stepResult = await step.execute(context);

        // Merge results into context
        context.results = {
          ...context.results,
          ...stepResult,
        };

        executedSteps.push(step.id);
        onProgress?.(step.id, `${step.name} complete`, step.progressEnd);
        logger.info('Workflow step complete', { workflow: config.name, stepId: step.id, stepName: step.name });
      } catch (stepError) {
        logger.error('Workflow step failed', stepError, { workflow: config.name, stepId: step.id, stepName: step.name });
        throw new Error(
          `Step "${step.name}" failed: ${stepError instanceof Error ? stepError.message : 'Unknown error'}`
        );
      }
    }

    const executionTime = Date.now() - startTime;
    logger.info('Workflow complete', { workflow: config.name, executionTime });
    onProgress?.('complete', 'Workflow complete!', 100);

    return {
      success: true,
      results: context.results,
      executedSteps,
      skippedSteps,
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Workflow failed', error, { workflow: input.config.name, executionTime });

    return {
      success: false,
      results: context.results,
      error: error instanceof Error ? error.message : 'Unknown error',
      executedSteps,
      skippedSteps,
      executionTime,
    };
  }
}

/**
 * Create a simple progress callback that logs to console
 */
export function createConsoleProgress(): ProgressCallback {
  return (stepId, message, progress) => {
    logger.debug('Workflow progress', { stepId, message, progress });
  };
}
