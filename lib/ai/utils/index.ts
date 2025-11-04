/**
 * AI Utils - Main Export
 * 
 * Clean, organized utilities for AI operations
 */

export * from './message-builder';
export * from './response-parser';
export * from './state-manager';
export * from './token-counter';
export * from './structured-parser';

// Re-export common functions for convenience
export {
  createSystemMessage,
  createHumanMessage,
  createAIMessage
} from './message-builder';

export {
  parseJSON,
  parseAgentJSON,
  robustParseJSON
} from './response-parser';

export {
  addMessage,
  addError,
  setCurrentStep,
  addTokens,
  hasErrors,
  logState
} from './state-manager';

export {
  estimateTokens,
  createTokenTracker
} from './token-counter';

export {
  createStructuredParser,
  createJsonParser,
  parseWithFallback,
  validateAgainstSchema,
  safeParseWithSchema,
  formatZodError,
  RobustStructuredParser
} from './structured-parser';
