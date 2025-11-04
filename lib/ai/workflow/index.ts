// Types
export type {
  ResumeGenerationState,
  ResumeGenerationOptions,
  ResumeGenerationResult
} from './types';

// Graph and workflow
export {
  createResumeWorkflowGraph,
  compileResumeWorkflow,
  testEmptyWorkflow
} from './graph';

// Checkpointing and memory
export {
  createMemoryCheckpointer,
  createThreadId,
  parseThreadId,
  createCheckpointConfig,
  createCheckpointConfigWithThreadId,
  extractCheckpointMetadata,
  canResumeWorkflow,
  getNextStep,
  WorkflowCheckpointStore
} from './checkpointing';

export type {
  CheckpointConfig,
  CheckpointMetadata
} from './checkpointing';

// Workflow service (high-level API)
export {
  ResumeWorkflowService,
  resumeWorkflowService,
  generateResume
} from './service';

export type {
  GenerateResumeInput,
  GenerateResumeResult
} from './service';

// Agents (from lib/ai/agents)
export {
  analyzeJobAgent,
  JobAnalysisAgent
} from '../agents/job-analysis.agent';

export {
  profileMatchingAgent,
  testProfileMatchingAgent
} from '../agents/profile-matching.agent';

export {
  contentOptimizationAgent,
  testContentOptimizationAgent
} from '../agents/content-optimization.agent';

export {
  formatValidationAgent,
  testFormatValidationAgent
} from '../agents/format-validation.agent';

export {
  outputGeneratorAgent,
  testOutputGeneratorAgent
} from '../agents/output-generator.agent';

// Workflow nodes (from lib/ai/workflow/nodes)
export {
  jobAnalysisNode,
  profileMatchingNode,
  contentOptimizationNode,
  formatValidationNode,
  outputGenerationNode,
  coverLetterGenerationNode
} from './nodes';

// Utilities
export {
  createSystemMessage,
  createHumanMessage,
  createAIMessage,
  formatMessages,
  addMessage,
  addError,
  setCurrentStep,
  addTokens,
  hasJobAnalysis,
  hasProfileMatch,
  hasOptimizedContent,
  hasFormatValidation,
  extractTextContent,
  parseAgentJSON,
  createInitialState,
  validateUserProfile,
  logState
} from './utils';
