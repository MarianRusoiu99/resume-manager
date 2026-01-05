/**
 * Conversation mode
 */
export type ConversationMode =
  | 'resume-generation'
  | 'resume-enhancement'
  | 'cover-letter-generation'
  | 'template-generation'
  | 'template-enhancement'
  | 'text-enhancement';

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
 * Conversation state
 */
export interface ConversationState<T = unknown> {
  id: string | null;
  mode: ConversationMode;
  messages: ConversationMessage[];
  context: ConversationContext;
  output: T | null;
  isLoading: boolean;
  error: string | null;
}

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
}

/**
 * Hook options
 */
export interface UseConversationOptions<T = unknown> {
  mode: ConversationMode;
  initialContext?: ConversationContext;
  /** Called when generation completes */
  onComplete?: (output: T) => void;
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
