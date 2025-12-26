/**
 * AI Chat System
 *
 * Unified conversational AI system for resume/cover letter/template generation
 */

// Message types and utilities
export * from './message';

// Context management
export * from './context';

// Conversation management
export {
  ConversationManager,
  conversationStore,
  type Conversation,
  type ConversationMode,
  type CreateConversationOptions,
  type ConversationSnapshot,
} from './conversation';

// AI Orchestrator
export {
  AIOrchestrator,
  registerMode,
  getMode,
  getModeOrThrow,
  requiresVision,
  type AIStreamChunk,
  type AIStreamChunkType,
  type OrchestratorOptions,
  type GenerationResult,
} from './orchestrator';
