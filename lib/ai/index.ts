/**
 * AI Module - Main Export
 * 
 * Centralized export for all AI functionality
 */

// Configuration
export * from './config';

// Types (primary source for types)
export * from './types';

// Prompts
export * from './prompts';

// Utilities (from our new utils)
export {
  createSystemMessage,
  createHumanMessage,
  createAIMessage,
  type SimpleMessage,
  createConversationHistory,
  formatMessagesForLog,
  extractTextContent,
  countMessageCharacters,
  truncateMessageHistory
} from './utils/message-builder';

export {
  parseJSON,
  parseAgentJSON,
  robustParseJSON,
  safeStringify,
  validateRequiredFields
} from './utils/response-parser';

export {
  addMessage,
  addMessages,
  addError,
  addErrors,
  setCurrentStep,
  addTokens,
  clearErrors,
  hasErrors,
  logState
} from './utils/state-manager';

export {
  estimateTokens,
  estimateTokensFromJSON,
  estimateTokensFromInputs,
  TokenTracker,
  createTokenTracker
} from './utils/token-counter';

// Providers
export {
  OpenAIProvider,
  AIProviderRegistry,
  type ProviderType,
  createProvider,
  isProviderSupported,
  getProviderForUser,
  testProvider,
  checkProviderHealth,
  getProviderWithRetry,
  clearProviderCache,
  getProviderCacheStats,
  getAvailableProviders
} from './providers';

export type {
  AIProviderConfig,
  AIProviderCapabilities,
  AIMessage,
  AICompletionResponse,
  AICompletionOptions
} from './providers/base';

// Agents (new modular architecture)
export {
  BaseAgent,
  createAgentMessages,
  executeAgentBatch,
  JobAnalysisAgent,
  analyzeJob
} from './agents';

export type {
  BaseAgentConfig,
  AgentResult
} from './agents';

// Workflow (existing, only export what's needed)
export type {
  ResumeGenerationState,
  ResumeGenerationOptions,
  ResumeGenerationResult
} from './workflow/types';

export {
  createResumeWorkflowGraph,
  compileResumeWorkflow
} from './workflow/graph';

export {
  analyzeJobAgent
} from './workflow/agents/job-analysis.agent';
