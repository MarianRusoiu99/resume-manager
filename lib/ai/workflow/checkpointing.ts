/**
 * LangChain Memory and Checkpointing
 * 
 * Provides checkpointing functionality for the resume generation workflow.
 * Checkpoints allow:
 * - Workflow resumption after interruption
 * - Step-by-step debugging
 * - Rollback to previous states
 * - Persistence of intermediate results
 * 
 * Currently uses MemorySaver for in-memory checkpointing.
 * Can be upgraded to SqliteSaver or PostgresSaver for production persistence.
 */

import { MemorySaver } from '@langchain/langgraph';
import type { ResumeGenerationState } from './types';

/**
 * Thread/Session ID format: userId-timestamp
 * This allows multiple concurrent workflow executions per user
 */
export function createThreadId(userId: string): string {
  const timestamp = Date.now();
  return `${userId}-${timestamp}`;
}

/**
 * Parse thread ID to extract userId and timestamp
 * Thread ID format: userId-timestamp (timestamp is always last segment after last hyphen)
 */
export function parseThreadId(threadId: string): { userId: string; timestamp: number } | null {
  // Find the last hyphen
  const lastHyphenIndex = threadId.lastIndexOf('-');
  
  if (lastHyphenIndex === -1) {
    return null;
  }
  
  const userId = threadId.substring(0, lastHyphenIndex);
  const timestampStr = threadId.substring(lastHyphenIndex + 1);
  const timestamp = parseInt(timestampStr, 10);
  
  if (isNaN(timestamp) || userId.length === 0) {
    return null;
  }
  
  return { userId, timestamp };
}

/**
 * Create a memory-based checkpointer
 * 
 * MemorySaver stores checkpoints in memory (lost on restart).
 * For production, consider:
 * - SqliteSaver: Local file-based persistence
 * - PostgresSaver: Database-backed persistence (recommended for production)
 * 
 * @returns MemorySaver instance for workflow checkpointing
 */
export function createMemoryCheckpointer() {
  return new MemorySaver();
}

/**
 * Checkpoint configuration for workflow execution
 */
export interface CheckpointConfig {
  /**
   * Thread ID for this workflow execution
   * Format: userId-timestamp
   */
  configurable: {
    thread_id: string;
  };
}

/**
 * Create checkpoint configuration for a user's workflow
 * 
 * @param userId - User ID for this workflow
 * @returns Checkpoint configuration with thread ID
 */
export function createCheckpointConfig(userId: string): CheckpointConfig {
  return {
    configurable: {
      thread_id: createThreadId(userId),
    },
  };
}

/**
 * Create checkpoint configuration with a specific thread ID
 * Useful for resuming previous workflows
 * 
 * @param threadId - Existing thread ID to resume
 * @returns Checkpoint configuration
 */
export function createCheckpointConfigWithThreadId(threadId: string): CheckpointConfig {
  return {
    configurable: {
      thread_id: threadId,
    },
  };
}

/**
 * Checkpoint metadata for tracking workflow progress
 */
export interface CheckpointMetadata {
  threadId: string;
  userId: string;
  startTime: number;
  currentStep?: string;
  completedSteps: string[];
  errors: string[];
}

/**
 * Extract metadata from workflow state for checkpointing
 * 
 * @param state - Current workflow state
 * @param threadId - Thread ID for this execution
 * @returns Checkpoint metadata
 */
export function extractCheckpointMetadata(
  state: ResumeGenerationState,
  threadId: string
): CheckpointMetadata {
  const parsed = parseThreadId(threadId);
  
  return {
    threadId,
    userId: parsed?.userId || 'unknown',
    startTime: parsed?.timestamp || Date.now(),
    currentStep: state.currentStep,
    completedSteps: getCompletedSteps(state),
    errors: state.errors || [],
  };
}

/**
 * Determine which workflow steps have been completed
 * based on state fields that have been populated
 * 
 * @param state - Current workflow state
 * @returns Array of completed step names
 */
function getCompletedSteps(state: ResumeGenerationState): string[] {
  const steps: string[] = [];
  
  if (state.jobAnalysis) {
    steps.push('analyze_job');
  }
  
  if (state.profileMatch) {
    steps.push('match_profile');
  }
  
  if (state.optimizedResume) {
    steps.push('optimize_content');
  }
  
  if (state.formatValidation) {
    steps.push('validate_format');
  }
  
  if (state.generatedResume) {
    steps.push('generate_output');
  }
  
  return steps;
}

/**
 * Check if a workflow can be resumed from a checkpoint
 * 
 * @param state - Workflow state from checkpoint
 * @returns True if workflow has intermediate results and can be resumed
 */
export function canResumeWorkflow(state: ResumeGenerationState): boolean {
  // Can resume if we have at least one intermediate result
  // but haven't completed the final output
  const hasIntermediateResults =
    state.jobAnalysis !== undefined ||
    state.profileMatch !== undefined ||
    state.optimizedResume !== undefined ||
    state.formatValidation !== undefined;
  
  const isComplete = state.generatedResume !== undefined;  return hasIntermediateResults && !isComplete;
}

/**
 * Get the next step to execute when resuming a workflow
 * 
 * @param state - Workflow state from checkpoint
 * @returns Name of next node to execute, or null if complete
 */
export function getNextStep(state: ResumeGenerationState): string | null {
  if (!state.jobAnalysis) {
    return 'analyze_job';
  }
  
  if (!state.profileMatch) {
    return 'match_profile';
  }
  
  if (!state.optimizedResume) {
    return 'optimize_content';
  }
  
  if (!state.formatValidation) {
    return 'validate_format';
  }
  
  if (!state.generatedResume) {
    return 'generate_output';
  }
  
  // Workflow complete
  return null;
}

/**
 * Memory-based workflow checkpoint storage
 * 
 * This class provides a simple interface for storing and retrieving
 * workflow checkpoints in memory. In production, you should use
 * PostgresSaver or similar for persistence.
 */
export class WorkflowCheckpointStore {
  private checkpointer: MemorySaver;
  
  constructor() {
    this.checkpointer = createMemoryCheckpointer();
  }
  
  /**
   * Get the checkpointer instance for use with StateGraph.compile()
   */
  getCheckpointer(): MemorySaver {
    return this.checkpointer;
  }
  
  /**
   * Create a new checkpoint configuration for a user
   */
  createConfig(userId: string): CheckpointConfig {
    return createCheckpointConfig(userId);
  }
  
  /**
   * Resume an existing workflow by thread ID
   */
  resumeConfig(threadId: string): CheckpointConfig {
    return createCheckpointConfigWithThreadId(threadId);
  }
}
