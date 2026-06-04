/**
 * Conversation mode - imported from canonical source for local use and re-exported
 */
import type { ConversationMode } from '@/lib/ai/chat/conversation/types';
export type { ConversationMode };

/**
 * Attachment for sending to the API
 */
export interface ConversationAttachment {
  type: 'document' | 'image' | 'resume' | 'job-description' | 'template';
  name: string;
  content: string;
  mimeType: string;
}

/**
 * Message in the conversation
 */
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: ConversationAttachment[];
  /** Structured output from assistant (if available) */
  output?: unknown;
  /** Accumulated reasoning/thinking text from the AI (for reasoning-capable models) */
  thinking?: string;
}

/**
 * Context for resume/cover letter generation
 */
export interface ConversationContext {
  userProfile?: {
    resume?: Record<string, unknown>;
    name?: string;
  };
  job?: {
    description?: string;
    title?: string;
    company?: string;
  };
  template?: {
    htmlTemplate?: string;
    name?: string;
  };
  currentResume?: Record<string, unknown>;
  currentCoverLetter?: string;
  personalInstructions?: string;
}

/**
 * Domain data for a conversation — the actual business/semantic content.
 * These fields represent "what the conversation IS", independent of any
 * UI rendering concerns such as loading spinners or error toasts.
 */
export interface ConversationData<T = unknown> {
  id: string | null;
  mode: ConversationMode;
  messages: ConversationMessage[];
  context: ConversationContext;
  output: T | null;
  savedId: string | null;
}

/**
 * UI state for a conversation — transient rendering concerns only.
 * These fields drive UI indicators (spinners, error banners, streaming dots)
 * and have no meaning outside the presentation layer.
 */
export interface ConversationUIState {
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
}

/**
 * Full conversation state — combines domain data with UI state.
 *
 * @example Splitting for pure-logic consumers:
 * ```ts
 * function processConversation(data: ConversationData) { ... }  // no UI coupling
 * function renderChat(state: ConversationState) { ... }         // full state
 * ```
 */
export interface ConversationState<T = unknown>
  extends ConversationData<T>,
    ConversationUIState {}

/**
 * Options for sending a message
 */
export interface SendMessageOptions {
  message: string;
  attachments?: ConversationAttachment[];
  /** Override model for this message */
  modelId?: string;
  /** Context override for this message (merged with existing context) */
  contextOverride?: Partial<ConversationContext>;
  /** Enable streaming response */
  stream?: boolean;
  /** Session-scoped memory text to inject into system prompt */
  agentMemory?: string;
}

/**
 * Hook options
 */
export interface UseConversationOptions<T = unknown> {
  mode: ConversationMode;
  initialContext?: ConversationContext;
  /** Optional localStorage key for persisting conversation between refreshes */
  persistenceKey?: string;
  /** Called when generation completes */
  onComplete?: (output: T, savedId?: string | null) => void;
  /** Called on error */
  onError?: (error: string) => void;
}

/**
 * Hook return type
 */
export interface UseConversationReturn<T = unknown> {
  /** Current conversation state */
  state: ConversationState<T>;
  /** Send a message to the AI */
  sendMessage: (options: SendMessageOptions) => Promise<T | null>;
  /** Update context */
  updateContext: (context: Partial<ConversationContext>) => void;
  /** Clear conversation and start fresh */
  reset: () => void;
  /** Abort current generation */
  abort: () => void;
  /** Whether currently generating */
  isGenerating: boolean;
}
